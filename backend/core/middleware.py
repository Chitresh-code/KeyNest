"""
Custom middleware for KeyNest API
"""
import json
import logging
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from django.utils import timezone

logger = logging.getLogger(__name__)


class APIResponseMiddleware(MiddlewareMixin):
    """
    Middleware to standardize API responses for frontend consumption
    """
    
    def process_response(self, request, response):
        """
        Process API responses to ensure consistent format
        """
        # Only process API endpoints
        if not request.path.startswith('/api/'):
            return response
        
        # Skip if response is already processed or not JSON
        if hasattr(response, '_api_processed') or not hasattr(response, 'data'):
            return response
        
        # Add CORS headers for API endpoints
        if request.method == 'OPTIONS':
            response['Access-Control-Allow-Origin'] = '*'
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'authorization, content-type, accept'
            response['Access-Control-Max-Age'] = '86400'
        
        # Add common API headers
        response['Content-Type'] = 'application/json'
        response['X-API-Version'] = '1.0.0'
        response['X-Timestamp'] = timezone.now().isoformat()
        
        # Mark as processed
        response._api_processed = True
        
        return response
    
    def process_exception(self, request, exception):
        """
        Handle exceptions for API endpoints
        """
        if not request.path.startswith('/api/'):
            return None
        
        logger.error(f"API Exception: {str(exception)}", exc_info=True)
        
        # Create standardized error response
        error_response = {
            'error': 'Internal server error',
            'message': 'An unexpected error occurred',
            'timestamp': timezone.now().isoformat(),
            'path': request.path,
        }
        
        # Add debug information in development
        from django.conf import settings
        if settings.DEBUG:
            error_response['debug'] = {
                'exception_type': exception.__class__.__name__,
                'exception_message': str(exception),
            }
        
        return JsonResponse(error_response, status=500)


class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Add security headers to all responses
    """
    
    def process_response(self, request, response):
        """
        Add security headers
        """
        # Security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # CSP for API endpoints
        if request.path.startswith('/api/'):
            response['Content-Security-Policy'] = "default-src 'none'; frame-ancestors 'none'"
        
        return response


class RequestLoggingMiddleware(MiddlewareMixin):
    """
    Log API requests for monitoring and debugging
    """
    
    def process_request(self, request):
        """
        Log incoming API requests
        """
        if not request.path.startswith('/api/'):
            return None
        
        # Get client IP
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        
        # Log request details
        logger.info(f"API Request: {request.method} {request.path} from {ip}")
        
        # Store request start time for response time calculation
        request._request_start_time = timezone.now()
        
        return None
    
    def process_response(self, request, response):
        """
        Log API responses
        """
        if not request.path.startswith('/api/') or not hasattr(request, '_request_start_time'):
            return response
        
        # Calculate response time
        response_time = timezone.now() - request._request_start_time
        response_time_ms = int(response_time.total_seconds() * 1000)
        
        # Log response details
        logger.info(f"API Response: {response.status_code} for {request.method} {request.path} ({response_time_ms}ms)")
        
        # Add response time header
        response['X-Response-Time'] = f"{response_time_ms}ms"
        
        return response


class InputSanitizationMiddleware(MiddlewareMixin):
    """
    Middleware to sanitize user input and prevent common attacks
    """
    
    def process_request(self, request):
        """
        Sanitize request data for API endpoints
        """
        if not request.path.startswith('/api/'):
            return None
        
        # Check for suspicious patterns
        suspicious_patterns = [
            r'<script[^>]*>',  # XSS attempts
            r'javascript:',    # JavaScript injection
            r'vbscript:',      # VBScript injection
            r'data:',          # Data URLs (potential XSS)
            r'eval\s*\(',      # Eval attempts
            r'union\s+select', # SQL injection attempts
            r'drop\s+table',   # SQL injection attempts
        ]
        
        import re
        def check_suspicious_content(content):
            if not isinstance(content, str):
                return False
            content_lower = content.lower()
            return any(re.search(pattern, content_lower, re.IGNORECASE) for pattern in suspicious_patterns)
        
        # Check request data
        if hasattr(request, 'body') and request.body:
            try:
                import json
                data = json.loads(request.body)
                if self._contains_suspicious_content(data, check_suspicious_content):
                    logger.warning(f"Suspicious content detected from {request.META.get('REMOTE_ADDR')}")
                    from django.http import JsonResponse
                    return JsonResponse({
                        'error': 'Invalid request',
                        'message': 'Request contains potentially malicious content'
                    }, status=400)
            except (json.JSONDecodeError, UnicodeDecodeError):
                pass
        
        return None
    
    def _contains_suspicious_content(self, data, check_func):
        """
        Recursively check data structure for suspicious content
        """
        if isinstance(data, str):
            return check_func(data)
        elif isinstance(data, dict):
            return any(
                check_func(str(k)) or self._contains_suspicious_content(v, check_func)
                for k, v in data.items()
            )
        elif isinstance(data, list):
            return any(self._contains_suspicious_content(item, check_func) for item in data)
        return False


class RateLimitHeaderMiddleware(MiddlewareMixin):
    """
    Add rate limiting headers to API responses
    """
    
    def process_response(self, request, response):
        """
        Add rate limit headers for API endpoints
        """
        if not request.path.startswith('/api/'):
            return response
        
        # Add rate limiting headers
        if hasattr(request, 'user') and request.user.is_authenticated:
            response['X-RateLimit-Limit'] = '1000'
            response['X-RateLimit-Window'] = '3600'  # 1 hour
        else:
            response['X-RateLimit-Limit'] = '100'
            response['X-RateLimit-Window'] = '3600'  # 1 hour
        
        # Add current timestamp for client-side rate limiting
        response['X-RateLimit-Reset'] = str(int(timezone.now().timestamp()) + 3600)
        
        return response