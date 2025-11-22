#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
import time

class NightBlogAPITester:
    def __init__(self, base_url="https://midnight-post.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = None
        self.user_id = None
        self.username = None
        self.blog_id = None
        self.comment_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
            self.failed_tests.append(f"{name}: {details}")

    def make_request(self, method, endpoint, data=None, files=None, headers=None):
        """Make HTTP request with proper headers"""
        url = f"{self.api_url}/{endpoint}"
        
        request_headers = {}
        if self.session_token:
            request_headers['Authorization'] = f'Bearer {self.session_token}'
        
        if headers:
            request_headers.update(headers)
            
        try:
            if method == 'GET':
                response = requests.get(url, headers=request_headers, params=data)
            elif method == 'POST':
                if files:
                    response = requests.post(url, headers=request_headers, data=data, files=files)
                else:
                    if data and not files:
                        request_headers['Content-Type'] = 'application/json'
                        response = requests.post(url, headers=request_headers, json=data)
                    else:
                        response = requests.post(url, headers=request_headers, data=data)
            elif method == 'PUT':
                if files:
                    response = requests.put(url, headers=request_headers, data=data, files=files)
                else:
                    if data and not files:
                        request_headers['Content-Type'] = 'application/json'
                        response = requests.put(url, headers=request_headers, json=data)
                    else:
                        response = requests.put(url, headers=request_headers, data=data)
            elif method == 'DELETE':
                response = requests.delete(url, headers=request_headers)
            
            return response
        except Exception as e:
            print(f"Request failed: {str(e)}")
            return None

    def test_root_endpoint(self):
        """Test API root endpoint"""
        response = self.make_request('GET', '')
        success = response and response.status_code == 200
        details = f"Status: {response.status_code if response else 'No response'}"
        self.log_test("API Root Endpoint", success, details)
        return success

    def create_test_user_session(self):
        """Create test user and session using MongoDB directly"""
        try:
            import subprocess
            
            # Generate unique identifiers
            timestamp = str(int(time.time()))
            user_id = f"test-user-{timestamp}"
            session_token = f"test_session_{timestamp}"
            email = f"test.user.{timestamp}@example.com"
            username = f"testuser{timestamp[-6:]}"
            
            # MongoDB command to create test user and session
            mongo_cmd = f'''
            mongosh --eval "
            use('nightblog');
            db.users.insertOne({{
              id: '{user_id}',
              email: '{email}',
              name: 'Test User {timestamp[-4:]}',
              username: '{username}',
              picture: 'https://via.placeholder.com/150',
              bio: 'Test user for API testing',
              theme_color: '#00ff88',
              created_at: new Date()
            }});
            db.user_sessions.insertOne({{
              user_id: '{user_id}',
              session_token: '{session_token}',
              expires_at: new Date(Date.now() + 7*24*60*60*1000),
              created_at: new Date()
            }});
            print('User and session created successfully');
            "
            '''
            
            result = subprocess.run(mongo_cmd, shell=True, capture_output=True, text=True)
            
            if result.returncode == 0:
                self.session_token = session_token
                self.user_id = user_id
                self.username = username
                print(f"✅ Created test user: {username} with session: {session_token[:20]}...")
                return True
            else:
                print(f"❌ Failed to create test user: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"❌ Error creating test user: {str(e)}")
            return False

    def test_auth_me(self):
        """Test /auth/me endpoint"""
        response = self.make_request('GET', 'auth/me')
        success = response and response.status_code == 200
        
        if success:
            user_data = response.json()
            success = 'id' in user_data and 'username' in user_data
            details = f"User: {user_data.get('username', 'Unknown')}"
        else:
            details = f"Status: {response.status_code if response else 'No response'}"
            
        self.log_test("Auth Me Endpoint", success, details)
        return success

    def test_get_blogs(self):
        """Test GET /blogs endpoint"""
        response = self.make_request('GET', 'blogs')
        success = response and response.status_code == 200
        
        if success:
            blogs = response.json()
            success = isinstance(blogs, list)
            details = f"Found {len(blogs)} blogs"
        else:
            details = f"Status: {response.status_code if response else 'No response'}"
            
        self.log_test("Get Blogs", success, details)
        return success

    def test_search_blogs(self):
        """Test blog search functionality"""
        response = self.make_request('GET', 'blogs', {'search': 'test'})
        success = response and response.status_code == 200
        
        if success:
            blogs = response.json()
            success = isinstance(blogs, list)
            details = f"Search returned {len(blogs)} results"
        else:
            details = f"Status: {response.status_code if response else 'No response'}"
            
        self.log_test("Blog Search", success, details)
        return success

    def test_create_blog(self):
        """Test blog creation"""
        blog_data = {
            'title': f'Test Blog {datetime.now().strftime("%H%M%S")}',
            'content': '# Test Blog\n\nThis is a **test blog** with *markdown* content.\n\n- Item 1\n- Item 2\n\n```python\nprint("Hello World")\n```',
            'is_published': True
        }
        
        response = self.make_request('POST', 'blogs', blog_data)
        success = response and response.status_code == 200
        
        if success:
            blog = response.json()
            self.blog_id = blog.get('id')
            success = 'id' in blog and 'title' in blog
            details = f"Created blog: {blog.get('title', 'Unknown')}"
        else:
            details = f"Status: {response.status_code if response else 'No response'}"
            
        self.log_test("Create Blog", success, details)
        return success

    def test_get_blog(self):
        """Test getting a specific blog"""
        if not self.blog_id:
            self.log_test("Get Blog", False, "No blog ID available")
            return False
            
        response = self.make_request('GET', f'blogs/{self.blog_id}')
        success = response and response.status_code == 200
        
        if success:
            blog = response.json()
            success = blog.get('id') == self.blog_id
            details = f"Retrieved blog: {blog.get('title', 'Unknown')}"
        else:
            details = f"Status: {response.status_code if response else 'No response'}"
            
        self.log_test("Get Blog", success, details)
        return success

    def test_update_blog(self):
        """Test blog update"""
        if not self.blog_id:
            self.log_test("Update Blog", False, "No blog ID available")
            return False
            
        update_data = {
            'title': f'Updated Test Blog {datetime.now().strftime("%H%M%S")}',
            'content': '# Updated Blog\n\nThis blog has been **updated** with new content.',
            'is_published': True
        }
        
        response = self.make_request('PUT', f'blogs/{self.blog_id}', update_data)
        success = response and response.status_code == 200
        
        if success:
            blog = response.json()
            success = 'Updated' in blog.get('title', '')
            details = f"Updated blog: {blog.get('title', 'Unknown')}"
        else:
            details = f"Status: {response.status_code if response else 'No response'}"
            
        self.log_test("Update Blog", success, details)
        return success

    def test_like_blog(self):
        """Test blog like functionality"""
        if not self.blog_id:
            self.log_test("Like Blog", False, "No blog ID available")
            return False
            
        response = self.make_request('POST', f'blogs/{self.blog_id}/like')
        success = response and response.status_code == 200
        
        if success:
            result = response.json()
            success = 'liked' in result
            details = f"Like status: {result.get('liked', 'Unknown')}"
        else:
            details = f"Status: {response.status_code if response else 'No response'}"
            
        self.log_test("Like Blog", success, details)
        return success

    def test_check_liked(self):
        """Test checking if blog is liked"""
        if not self.blog_id:
            self.log_test("Check Liked", False, "No blog ID available")
            return False
            
        response = self.make_request('GET', f'blogs/{self.blog_id}/liked')
        success = response and response.status_code == 200
        
        if success:
            result = response.json()
            success = 'liked' in result
            details = f"Liked status: {result.get('liked', 'Unknown')}"
        else:
            details = f"Status: {response.status_code if response else 'No response'}"
            
        self.log_test("Check Liked", success, details)
        return success

    def test_add_comment(self):
        """Test adding a comment"""
        if not self.blog_id:
            self.log_test("Add Comment", False, "No blog ID available")
            return False
            
        comment_data = {
            'text': f'Test comment added at {datetime.now().strftime("%H:%M:%S")}'
        }
        
        response = self.make_request('POST', f'blogs/{self.blog_id}/comments', comment_data)
        success = response and response.status_code == 200
        
        if success:
            comment = response.json()
            self.comment_id = comment.get('id')
            success = 'id' in comment and 'text' in comment
            details = f"Added comment: {comment.get('text', 'Unknown')[:30]}..."
        else:
            details = f"Status: {response.status_code if response else 'No response'}"
            
        self.log_test("Add Comment", success, details)
        return success

    def test_get_comments(self):
        """Test getting blog comments"""
        if not self.blog_id:
            self.log_test("Get Comments", False, "No blog ID available")
            return False
            
        response = self.make_request('GET', f'blogs/{self.blog_id}/comments')
        success = response and response.status_code == 200
        
        if success:
            comments = response.json()
            success = isinstance(comments, list) and len(comments) > 0
            details = f"Found {len(comments)} comments"
        else:
            details = f"Status: {response.status_code if response else 'No response'}"
            
        self.log_test("Get Comments", success, details)
        return success

    def test_get_user_profile(self):
        """Test getting user profile"""
        if not self.username:
            self.log_test("Get User Profile", False, "No username available")
            return False
            
        response = self.make_request('GET', f'users/{self.username}')
        success = response and response.status_code == 200
        
        if success:
            profile = response.json()
            success = 'user' in profile and 'blogs' in profile
            details = f"Profile for: {profile.get('user', {}).get('username', 'Unknown')}"
        else:
            details = f"Status: {response.status_code if response else 'No response'}"
            
        self.log_test("Get User Profile", success, details)
        return success

    def test_update_profile(self):
        """Test updating user profile"""
        profile_data = {
            'bio': f'Updated bio at {datetime.now().strftime("%H:%M:%S")}',
            'theme_color': '#ff006e'
        }
        
        response = self.make_request('PUT', 'users/profile', profile_data)
        success = response and response.status_code == 200
        
        if success:
            user = response.json()
            success = user.get('theme_color') == '#ff006e'
            details = f"Updated profile for: {user.get('username', 'Unknown')}"
        else:
            details = f"Status: {response.status_code if response else 'No response'}"
            
        self.log_test("Update Profile", success, details)
        return success

    def test_logout(self):
        """Test logout functionality"""
        response = self.make_request('POST', 'auth/logout')
        success = response and response.status_code == 200
        
        if success:
            result = response.json()
            success = 'message' in result
            details = result.get('message', 'Logged out')
        else:
            details = f"Status: {response.status_code if response else 'No response'}"
            
        self.log_test("Logout", success, details)
        return success

    def test_delete_blog(self):
        """Test blog deletion (run last)"""
        if not self.blog_id:
            self.log_test("Delete Blog", False, "No blog ID available")
            return False
            
        response = self.make_request('DELETE', f'blogs/{self.blog_id}')
        success = response and response.status_code == 200
        
        if success:
            result = response.json()
            success = 'message' in result
            details = result.get('message', 'Blog deleted')
        else:
            details = f"Status: {response.status_code if response else 'No response'}"
            
        self.log_test("Delete Blog", success, details)
        return success

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting NightBlog API Tests...")
        print(f"🔗 Testing API: {self.api_url}")
        print("=" * 50)
        
        # Basic connectivity
        if not self.test_root_endpoint():
            print("❌ API not accessible, stopping tests")
            return False
            
        # Create test user and session
        if not self.create_test_user_session():
            print("❌ Could not create test user, stopping tests")
            return False
            
        # Authentication tests
        self.test_auth_me()
        
        # Blog tests
        self.test_get_blogs()
        self.test_search_blogs()
        self.test_create_blog()
        self.test_get_blog()
        self.test_update_blog()
        
        # Interaction tests
        self.test_like_blog()
        self.test_check_liked()
        self.test_add_comment()
        self.test_get_comments()
        
        # User tests
        self.test_get_user_profile()
        self.test_update_profile()
        
        # Cleanup tests
        self.test_delete_blog()
        self.test_logout()
        
        # Print results
        print("=" * 50)
        print(f"📊 Tests completed: {self.tests_passed}/{self.tests_run}")
        
        if self.failed_tests:
            print("\n❌ Failed tests:")
            for failure in self.failed_tests:
                print(f"  - {failure}")
        
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"✅ Success rate: {success_rate:.1f}%")
        
        return success_rate >= 80

def main():
    tester = NightBlogAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())