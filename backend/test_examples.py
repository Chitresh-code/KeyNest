#!/usr/bin/env python
"""
KeyNest API Test Examples
Production-ready examples for testing KeyNest functionality
"""

import json
import requests
import os
from pathlib import Path

# Configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api"

# Test user credentials
TEST_USER = {
    "username": "testuser",
    "email": "test@keynest.com", 
    "password": "SecurePassword123!",
    "first_name": "Test",
    "last_name": "User"
}

# Sample .env file content for testing
SAMPLE_ENV_CONTENT = """# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/myapp
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp
DB_USER=myapp_user
DB_PASSWORD=super_secure_password

# API Keys
STRIPE_SECRET_KEY=sk_test_1234567890abcdef
STRIPE_PUBLIC_KEY=pk_test_0987654321fedcba
JWT_SECRET=my_jwt_secret_key_here

# External Services
REDIS_URL=redis://localhost:6379/0
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=noreply@myapp.com
EMAIL_HOST_PASSWORD=app_specific_password

# Feature Flags
ENABLE_FEATURE_X=true
DEBUG_MODE=false
LOG_LEVEL=INFO
"""

SAMPLE_JSON_CONTENT = {
    "DATABASE_URL": "postgresql://user:password@localhost:5432/myapp",
    "STRIPE_SECRET_KEY": "sk_test_1234567890abcdef",
    "JWT_SECRET": "my_jwt_secret_key_here",
    "REDIS_URL": "redis://localhost:6379/0",
    "ENABLE_FEATURE_X": "true",
    "DEBUG_MODE": "false"
}

class KeyNestAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.user_data = None
        self.organization_id = None
        self.project_id = None
        self.environment_id = None
        
    def register_user(self):
        """Register a new user"""
        print("🔐 Registering user...")
        response = self.session.post(
            f"{API_BASE}/auth/register/",
            json=TEST_USER
        )
        
        if response.status_code == 201:
            data = response.json()
            self.auth_token = data['token']
            self.user_data = data['user']
            self.organization_id = data['organization']['id']
            
            # Set authorization header
            self.session.headers.update({
                'Authorization': f'Token {self.auth_token}'
            })
            
            print(f"✅ User registered successfully: {self.user_data['email']}")
            print(f"📋 Organization: {data['organization']['name']}")
            return True
        else:
            print(f"❌ Registration failed: {response.text}")
            return False
    
    def create_project(self):
        """Create a test project"""
        print("\n📁 Creating project...")
        project_data = {
            "name": "Test Web App",
            "description": "A test web application project",
            "organization": self.organization_id
        }
        
        response = self.session.post(
            f"{API_BASE}/projects/",
            json=project_data
        )
        
        if response.status_code == 201:
            data = response.json()
            self.project_id = data['id']
            print(f"✅ Project created: {data['name']}")
            return True
        else:
            print(f"❌ Project creation failed: {response.text}")
            return False
    
    def create_environment(self):
        """Create a test environment"""
        print("\n🌍 Creating environment...")
        env_data = {
            "name": "production",
            "project": self.project_id,
            "environment_type": "production",
            "description": "Production environment"
        }
        
        response = self.session.post(
            f"{API_BASE}/environments/",
            json=env_data
        )
        
        if response.status_code == 201:
            data = response.json()
            self.environment_id = data['id']
            print(f"✅ Environment created: {data['name']}")
            return True
        else:
            print(f"❌ Environment creation failed: {response.text}")
            return False
    
    def add_variables_manually(self):
        """Add some variables manually"""
        print("\n⚙️ Adding environment variables...")
        
        test_vars = [
            {"key": "DATABASE_URL", "value": "postgresql://user:pass@localhost/db"},
            {"key": "SECRET_KEY", "value": "super-secret-key-here"},
            {"key": "DEBUG", "value": "false"}
        ]
        
        for var_data in test_vars:
            var_data["environment"] = self.environment_id
            response = self.session.post(
                f"{API_BASE}/variables/",
                json=var_data
            )
            
            if response.status_code == 201:
                print(f"✅ Variable added: {var_data['key']}")
            else:
                print(f"❌ Failed to add variable {var_data['key']}: {response.text}")
    
    def test_export(self, format_type="env"):
        """Test export functionality"""
        print(f"\n📤 Testing export (format: {format_type})...")
        
        response = self.session.get(
            f"{API_BASE}/environments/{self.environment_id}/export/",
            params={"format": format_type}
        )
        
        if response.status_code == 200:
            print(f"✅ Export successful!")
            print("📝 Exported content (first 200 chars):")
            content = response.text[:200]
            print(f"   {content}{'...' if len(response.text) > 200 else ''}")
            
            # Save to file for testing import
            filename = f"test_export.{format_type}"
            with open(filename, 'w') as f:
                f.write(response.text)
            print(f"💾 Saved to: {filename}")
            return True
        else:
            print(f"❌ Export failed: {response.text}")
            return False
    
    def test_import_file(self):
        """Test import from file"""
        print("\n📥 Testing file import...")
        
        # Create a temporary .env file for testing
        test_env_file = "test_import.env"
        with open(test_env_file, 'w') as f:
            f.write(SAMPLE_ENV_CONTENT)
        
        with open(test_env_file, 'rb') as f:
            files = {'file': (test_env_file, f, 'text/plain')}
            data = {'overwrite': 'true'}
            
            response = self.session.post(
                f"{API_BASE}/environments/{self.environment_id}/import/",
                files=files,
                data=data
            )
        
        # Clean up test file
        os.remove(test_env_file)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Import successful!")
            print(f"📊 Summary: {result['summary']}")
            return True
        else:
            print(f"❌ Import failed: {response.text}")
            return False
    
    def test_import_json_data(self):
        """Test import from JSON data"""
        print("\n📥 Testing JSON data import...")
        
        import_data = {
            "data": json.dumps(SAMPLE_JSON_CONTENT),
            "format": "json",
            "overwrite": "true"
        }
        
        response = self.session.post(
            f"{API_BASE}/environments/{self.environment_id}/import/",
            json=import_data
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ JSON import successful!")
            print(f"📊 Summary: {result['summary']}")
            return True
        else:
            print(f"❌ JSON import failed: {response.text}")
            return False
    
    def list_variables(self):
        """List all variables in environment"""
        print(f"\n📋 Listing environment variables...")
        
        response = self.session.get(
            f"{API_BASE}/environments/{self.environment_id}/variables/"
        )
        
        if response.status_code == 200:
            variables = response.json()
            print(f"✅ Found {len(variables)} variables:")
            
            for var in variables:
                # Show masked value for security
                value = var.get('decrypted_value', '[HIDDEN]')
                if isinstance(value, str) and len(value) > 20:
                    value = f"{value[:10]}...{value[-5:]}"
                print(f"   {var['key']} = {value}")
            return True
        else:
            print(f"❌ Failed to list variables: {response.text}")
            return False
    
    def test_audit_logs(self):
        """Test audit logs functionality"""
        print("\n📜 Checking audit logs...")
        
        response = self.session.get(f"{API_BASE}/audit-logs/")
        
        if response.status_code == 200:
            logs = response.json()
            recent_logs = logs.get('results', logs) if isinstance(logs, dict) else logs
            print(f"✅ Found {len(recent_logs)} recent audit log entries:")
            
            for log in recent_logs[:5]:  # Show first 5
                print(f"   {log['timestamp']}: {log['action']} {log['target_type']} by {log['user_name']}")
            return True
        else:
            print(f"❌ Failed to get audit logs: {response.text}")
            return False
    
    def run_full_test(self):
        """Run complete test suite"""
        print("🚀 Starting KeyNest API Full Test Suite")
        print("=" * 50)
        
        # Test sequence
        tests = [
            ("User Registration", self.register_user),
            ("Project Creation", self.create_project),
            ("Environment Creation", self.create_environment),
            ("Manual Variable Addition", self.add_variables_manually),
            ("Export (.env format)", lambda: self.test_export("env")),
            ("Export (JSON format)", lambda: self.test_export("json")),
            ("Export (YAML format)", lambda: self.test_export("yaml")),
            ("File Import Test", self.test_import_file),
            ("JSON Data Import", self.test_import_json_data),
            ("List Variables", self.list_variables),
            ("Audit Logs Check", self.test_audit_logs),
        ]
        
        results = {}
        for test_name, test_func in tests:
            try:
                results[test_name] = test_func()
            except Exception as e:
                print(f"❌ {test_name} failed with exception: {e}")
                results[test_name] = False
        
        # Summary
        print("\n" + "=" * 50)
        print("🏁 Test Results Summary:")
        
        passed = sum(1 for result in results.values() if result)
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"   {test_name}: {status}")
        
        print(f"\n📊 Overall: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed! KeyNest is working correctly.")
        else:
            print("⚠️ Some tests failed. Check the output above for details.")
        
        return passed == total


def main():
    """Main function to run tests"""
    print("KeyNest API Test Suite")
    print("Make sure the Django server is running on http://localhost:8000")
    
    # Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/health/", timeout=5)
        if response.status_code != 200:
            print("❌ Server health check failed")
            return
    except requests.exceptions.RequestException:
        print("❌ Cannot connect to server. Make sure Django is running on localhost:8000")
        return
    
    # Run tests
    tester = KeyNestAPITester()
    success = tester.run_full_test()
    
    return 0 if success else 1


if __name__ == "__main__":
    exit(main())