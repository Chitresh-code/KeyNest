import re
import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)


def get_client_ip(request) -> Optional[str]:
    """
    Get client IP address from request, handling proxy forwarded IPs
    Production-ready with multiple fallback mechanisms
    """
    # Check for forwarded IP (common in production with load balancers)
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        # Take the first IP in the chain (original client)
        ip = x_forwarded_for.split(',')[0].strip()
        return ip
    
    # Check for real IP (another common proxy header)
    x_real_ip = request.META.get('HTTP_X_REAL_IP')
    if x_real_ip:
        return x_real_ip.strip()
    
    # Fall back to remote address
    remote_addr = request.META.get('REMOTE_ADDR')
    if remote_addr:
        return remote_addr.strip()
    
    return None


def parse_env_file(content: str) -> Dict[str, str]:
    """
    Parse .env file content into a dictionary
    Production-ready with comprehensive error handling and validation
    """
    env_vars = {}
    
    if not content:
        return env_vars
    
    lines = content.splitlines()
    
    for line_num, line in enumerate(lines, 1):
        # Skip empty lines and comments
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        
        # Find the first equals sign
        if '=' not in line:
            logger.warning(f"Invalid line {line_num}: no '=' found: {line}")
            continue
        
        key, value = line.split('=', 1)
        key = key.strip()
        value = value.strip()
        
        # Validate key format
        if not key:
            logger.warning(f"Invalid line {line_num}: empty key")
            continue
        
        if not re.match(r'^[A-Za-z_][A-Za-z0-9_]*$', key):
            logger.warning(f"Invalid line {line_num}: invalid key format: {key}")
            continue
        
        # Handle quoted values
        if len(value) >= 2:
            if (value.startswith('"') and value.endswith('"')) or \
               (value.startswith("'") and value.endswith("'")):
                value = value[1:-1]
                # Unescape common sequences
                value = value.replace('\\"', '"').replace("\\'", "'").replace('\\\\', '\\')
        
        env_vars[key] = value
    
    return env_vars


def validate_env_data(data: Any) -> List[str]:
    """
    Validate environment data structure and content
    Returns list of validation errors (empty if valid)
    """
    errors = []
    
    # Check if data is a dictionary
    if not isinstance(data, dict):
        errors.append("Environment data must be a dictionary/object")
        return errors
    
    # Validate each key-value pair
    for key, value in data.items():
        # Validate key
        if not isinstance(key, str):
            errors.append(f"Key must be a string: {repr(key)}")
            continue
        
        if not key.strip():
            errors.append("Key cannot be empty or whitespace only")
            continue
        
        # Standard environment variable naming convention
        if not re.match(r'^[A-Za-z_][A-Za-z0-9_]*$', key):
            errors.append(f"Invalid key format '{key}': must start with letter/underscore, contain only letters/numbers/underscores")
        
        # Validate value
        if value is None:
            # Allow null values (they'll be converted to empty strings)
            continue
        
        # Convert non-string values to strings and validate
        try:
            str_value = str(value)
            # Check for extremely long values (security measure)
            if len(str_value) > 10000:
                errors.append(f"Value for '{key}' is too long (max 10000 characters)")
        except Exception as e:
            errors.append(f"Cannot convert value for '{key}' to string: {str(e)}")
    
    # Check for duplicate keys (case-insensitive)
    keys_lower = [k.lower() for k in data.keys()]
    if len(keys_lower) != len(set(keys_lower)):
        errors.append("Duplicate keys found (case-insensitive)")
    
    # Check total number of variables
    if len(data) > 1000:
        errors.append("Too many variables (max 1000 per environment)")
    
    return errors


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename for safe file system operations
    """
    # Remove or replace dangerous characters
    filename = re.sub(r'[^\w\s\-_\.]', '', filename)
    
    # Replace spaces with underscores
    filename = re.sub(r'\s+', '_', filename)
    
    # Remove multiple consecutive underscores/hyphens
    filename = re.sub(r'[_\-]+', '_', filename)
    
    # Trim and ensure reasonable length
    filename = filename.strip('_-')[:100]
    
    return filename or 'unnamed'


def format_file_size(size_bytes: int) -> str:
    """
    Format file size in human-readable format
    """
    if size_bytes == 0:
        return "0 B"
    
    size_names = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1
    
    return f"{size_bytes:.1f} {size_names[i]}"


def validate_import_format(content: str, declared_format: str = 'auto') -> tuple[str, bool]:
    """
    Validate and detect the format of imported content
    Returns tuple of (detected_format, is_valid)
    """
    content = content.strip()
    
    if not content:
        return 'unknown', False
    
    # Try to detect format automatically
    if declared_format == 'auto':
        # Check for JSON format
        if content.startswith('{') and content.endswith('}'):
            try:
                import json
                json.loads(content)
                return 'json', True
            except json.JSONDecodeError:
                pass
        
        # Check for YAML format
        if '---' in content or ':' in content:
            try:
                import yaml
                data = yaml.safe_load(content)
                if isinstance(data, dict):
                    return 'yaml', True
            except yaml.YAMLError:
                pass
        
        # Default to .env format
        return 'env', True
    
    # Validate declared format
    if declared_format == 'json':
        try:
            import json
            json.loads(content)
            return 'json', True
        except json.JSONDecodeError:
            return 'json', False
    
    elif declared_format == 'yaml':
        try:
            import yaml
            data = yaml.safe_load(content)
            if isinstance(data, dict):
                return 'yaml', True
            return 'yaml', False
        except yaml.YAMLError:
            return 'yaml', False
    
    elif declared_format == 'env':
        # .env format is more lenient, just check for basic structure
        lines = content.splitlines()
        valid_lines = 0
        for line in lines:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' in line:
                valid_lines += 1
        
        return 'env', valid_lines > 0
    
    return declared_format, False


def mask_sensitive_value(value: str, mask_char: str = '*', show_chars: int = 3) -> str:
    """
    Mask sensitive values for logging while keeping some characters visible
    """
    if not value or len(value) <= show_chars * 2:
        return mask_char * min(len(value), 8)
    
    return f"{value[:show_chars]}{mask_char * (len(value) - show_chars * 2)}{value[-show_chars:]}"


def generate_secure_filename(project_name: str, env_name: str, file_format: str) -> str:
    """
    Generate a secure filename for exported files
    """
    # Sanitize components
    safe_project = sanitize_filename(project_name)
    safe_env = sanitize_filename(env_name)
    safe_format = sanitize_filename(file_format)
    
    # Add timestamp to prevent conflicts
    from datetime import datetime
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    filename = f"{safe_project}_{safe_env}_{timestamp}.{safe_format}"
    return filename


class EnvFileParser:
    """
    Advanced .env file parser with support for various formats and edge cases
    """
    
    def __init__(self, strict_mode: bool = False):
        self.strict_mode = strict_mode
        self.errors = []
        self.warnings = []
    
    def parse(self, content: str) -> Dict[str, str]:
        """
        Parse content with comprehensive error tracking
        """
        self.errors.clear()
        self.warnings.clear()
        
        env_vars = {}
        
        if not content:
            return env_vars
        
        lines = content.splitlines()
        
        for line_num, line in enumerate(lines, 1):
            original_line = line
            line = line.strip()
            
            # Skip empty lines and comments
            if not line or line.startswith('#'):
                continue
            
            # Handle export statements (common in some .env files)
            if line.startswith('export '):
                line = line[7:].strip()
            
            # Find the first equals sign
            if '=' not in line:
                error_msg = f"Line {line_num}: No '=' found in '{original_line}'"
                if self.strict_mode:
                    self.errors.append(error_msg)
                    continue
                else:
                    self.warnings.append(error_msg)
                    continue
            
            key, value = line.split('=', 1)
            key = key.strip()
            value = value.strip()
            
            # Validate key
            validation_error = self._validate_key(key, line_num)
            if validation_error:
                if self.strict_mode:
                    self.errors.append(validation_error)
                    continue
                else:
                    self.warnings.append(validation_error)
            
            # Process value
            processed_value = self._process_value(value, line_num)
            env_vars[key] = processed_value
        
        return env_vars
    
    def _validate_key(self, key: str, line_num: int) -> Optional[str]:
        """Validate environment variable key"""
        if not key:
            return f"Line {line_num}: Empty key"
        
        if not re.match(r'^[A-Za-z_][A-Za-z0-9_]*$', key):
            return f"Line {line_num}: Invalid key format '{key}'"
        
        return None
    
    def _process_value(self, value: str, line_num: int) -> str:
        """Process and clean value"""
        if not value:
            return ""
        
        # Handle quoted values
        if len(value) >= 2:
            if value.startswith('"') and value.endswith('"'):
                # Double-quoted string
                value = value[1:-1]
                value = self._unescape_double_quoted(value)
            elif value.startswith("'") and value.endswith("'"):
                # Single-quoted string (literal)
                value = value[1:-1]
        
        return value
    
    def _unescape_double_quoted(self, value: str) -> str:
        """Unescape double-quoted string"""
        replacements = {
            '\\"': '"',
            "\\'": "'",
            '\\\\': '\\',
            '\\n': '\n',
            '\\t': '\t',
            '\\r': '\r',
        }
        
        for escaped, unescaped in replacements.items():
            value = value.replace(escaped, unescaped)
        
        return value