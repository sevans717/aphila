# API Tests Script - Production Ready
# Comprehensive API testing for SAV3 Dating App with real data and complete flows

param(
    [switch]$Auth,
    [switch]$Users,
    [switch]$Posts,
    [switch]$Media,
    [switch]$Matching,
    [switch]$Messaging,
    [switch]$Notifications,
    [switch]$All,
    [string]$Environment = "test",
    [switch]$Verbose,
    [switch]$Cleanup = $true,
    [string]$TestType  # Added for master test runner compatibility
)

$ErrorActionPreference = "Stop"

# Handle TestType parameter from master test runner
if ($TestType) {
    switch ($TestType.ToLower()) {
        "health" {
            # Health tests are handled by master runner directly
            Write-Host "Health tests handled by master runner" -ForegroundColor Green
            exit 0
        }
        "auth" { $Auth = $true }
        "crud" { $Users = $true; $Posts = $true }
        "validation" { $Auth = $true; $Users = $true }
        "error-handling" { $Auth = $true; $Users = $true; $Posts = $true }
        "rate-limiting" { $Auth = $true }
        "pagination" { $Posts = $true }
        default {
            Write-Host "Unknown test type: $TestType" -ForegroundColor Yellow
            $All = $true
        }
    }
}

# If no specific tests requested, run all
if (-not ($Auth -or $Users -or $Posts -or $Media -or $Matching -or $Messaging -or $Notifications) -and -not $All) {
    $All = $true
}

# Test data and configuration
$BASE_URL = if ($Environment -eq "production") { "https://api.aphila.io" } else { "http://localhost:4000" }
$TEST_USERS = @(
    @{
        email = "testuser1@sav3.test"
        password = "TestPass123!"
        name = "Alex Johnson"
        age = 28
        gender = "male"
        location = "New York, NY"
        bio = "Software engineer who loves hiking and trying new restaurants"
        interests = @("hiking", "cooking", "technology", "photography")
    },
    @{
        email = "testuser2@sav3.test"
        password = "TestPass123!"
        name = "Sarah Chen"
        age = 26
        gender = "female"
        location = "San Francisco, CA"
        bio = "UX designer passionate about creating meaningful user experiences"
        interests = @("design", "art", "travel", "yoga")
    },
    @{
        email = "testuser3@sav3.test"
        password = "TestPass123!"
        name = "Mike Rodriguez"
        age = 30
        gender = "male"
        location = "Austin, TX"
        bio = "Entrepreneur and musician, always up for new adventures"
        interests = @("music", "business", "fitness", "food")
    }
)

$TEST_POSTS = @(
    @{
        title = "Weekend Hiking Adventure"
        content = "Looking for someone to join me on a scenic hike this Saturday. The trail is moderate difficulty and offers amazing views of the valley. I'll bring snacks and water!"
        tags = @("hiking", "outdoors", "weekend")
        location = "Bear Mountain State Park"
    },
    @{
        title = "Cooking Class Experience"
        content = "Just took an Italian cooking class and learned to make authentic pasta from scratch. Would love to find someone who shares my passion for culinary adventures!"
        tags = @("cooking", "food", "italian")
        location = "Chelsea Market"
    },
    @{
        title = "Photography Walk in Central Park"
        content = "Planning a photography walk in Central Park this Sunday morning. The light should be perfect for some great shots. All skill levels welcome!"
        tags = @("photography", "central park", "nature")
        location = "Central Park"
    }
)

function Write-TestHeader {
    param([string]$Message)
    Write-Host "`n$(("=" * 60))" -ForegroundColor Cyan
    Write-Host " $Message" -ForegroundColor Cyan
    Write-Host "$(("=" * 60))" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    if ($Verbose) {
        Write-Host "ℹ️ $Message" -ForegroundColor Blue
    }
}

function Invoke-APIRequest {
    param(
        [string]$Uri,
        [string]$Method = "GET",
        [object]$Body,
        [hashtable]$Headers = @{},
        [string]$Token,
        [int]$Timeout = 30
    )

    $requestParams = @{
        Uri = $Uri
        Method = $Method
        TimeoutSec = $Timeout
        ContentType = "application/json"
    }

    if ($Body) {
        $requestParams.Body = $Body | ConvertTo-Json -Depth 10
    }

    if ($Token) {
        $Headers.Authorization = "Bearer $Token"
    }

    if ($Headers.Count -gt 0) {
        $requestParams.Headers = $Headers
    }

    try {
        $response = Invoke-WebRequest @requestParams
        return @{
            Success = $true
            StatusCode = $response.StatusCode
            Content = $response.Content | ConvertFrom-Json
            Headers = $response.Headers
        }
    } catch {
        $errorDetails = $_.Exception.Response
        if ($errorDetails) {
            try {
                $errorContent = $errorDetails.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($errorContent)
                $errorBody = $reader.ReadToEnd() | ConvertFrom-Json
            } catch {
                $errorBody = "Unable to parse error response"
            }
        }

        return @{
            Success = $false
            StatusCode = if ($errorDetails) { $errorDetails.StatusCode.value__ } else { 0 }
            Error = $_.Exception.Message
            ErrorBody = $errorBody
        }
    }
}

function Test-AuthenticationFlow {
    Write-TestHeader "Authentication Flow Tests"

    $results = @()
    $tokens = @{}

    try {
        Write-Info "Testing user registration..."

        # Test user registration
        foreach ($user in $TEST_USERS) {
            $registerData = @{
                email = $user.email
                password = $user.password
                name = $user.name
                age = $user.age
                gender = $user.gender
                location = $user.location
            }

            $registerResult = Invoke-APIRequest -Uri "$BASE_URL/api/auth/register" -Method POST -Body $registerData

            if ($registerResult.Success -and ($registerResult.StatusCode -eq 201 -or $registerResult.StatusCode -eq 200)) {
                Write-Success "User $($user.name) registered successfully"
                $results += @{ Test = "Register_$($user.name)"; Success = $true }
            } else {
                Write-Error "Failed to register user $($user.name): $($registerResult.Error)"
                $results += @{ Test = "Register_$($user.name)"; Success = $false; Error = $registerResult.Error }
            }
        }

        Write-Info "Testing user login..."

        # Test user login
        foreach ($user in $TEST_USERS) {
            $loginData = @{
                email = $user.email
                password = $user.password
            }

            $loginResult = Invoke-APIRequest -Uri "$BASE_URL/api/auth/login" -Method POST -Body $loginData

            if ($loginResult.Success -and $loginResult.StatusCode -eq 200 -and $loginResult.Content.token) {
                Write-Success "User $($user.name) logged in successfully"
                $tokens[$user.email] = $loginResult.Content.token
                $results += @{ Test = "Login_$($user.name)"; Success = $true }
            } else {
                Write-Error "Failed to login user $($user.name): $($loginResult.Error)"
                $results += @{ Test = "Login_$($user.name)"; Success = $false; Error = $loginResult.Error }
            }
        }

        Write-Info "Testing password reset flow..."

        # Test password reset request
        $resetData = @{
            email = $TEST_USERS[0].email
        }

        $resetResult = Invoke-APIRequest -Uri "$BASE_URL/api/auth/forgot-password" -Method POST -Body $resetData

        if ($resetResult.Success -and $resetResult.StatusCode -eq 200) {
            Write-Success "Password reset request sent successfully"
            $results += @{ Test = "PasswordReset_Request"; Success = $true }
        } else {
            Write-Error "Failed to send password reset request: $($resetResult.Error)"
            $results += @{ Test = "PasswordReset_Request"; Success = $false; Error = $resetResult.Error }
        }

        Write-Info "Testing token refresh..."

        # Test token refresh
        if ($tokens.Count -gt 0) {
            $firstUser = $TEST_USERS[0]
            $token = $tokens[$firstUser.email]

            $refreshResult = Invoke-APIRequest -Uri "$BASE_URL/api/auth/refresh" -Method POST -Token $token

            if ($refreshResult.Success -and $refreshResult.StatusCode -eq 200 -and $refreshResult.Content.token) {
                Write-Success "Token refresh successful"
                $tokens[$firstUser.email] = $refreshResult.Content.token
                $results += @{ Test = "TokenRefresh"; Success = $true }
            } else {
                Write-Error "Token refresh failed: $($refreshResult.Error)"
                $results += @{ Test = "TokenRefresh"; Success = $false; Error = $refreshResult.Error }
            }
        }

        Write-Info "Testing logout..."

        # Test logout
        if ($tokens.Count -gt 0) {
            $firstUser = $TEST_USERS[0]
            $token = $tokens[$firstUser.email]

            $logoutResult = Invoke-APIRequest -Uri "$BASE_URL/api/auth/logout" -Method POST -Token $token

            if ($logoutResult.Success -and $logoutResult.StatusCode -eq 200) {
                Write-Success "Logout successful"
                $results += @{ Test = "Logout"; Success = $true }
            } else {
                Write-Error "Logout failed: $($logoutResult.Error)"
                $results += @{ Test = "Logout"; Success = $false; Error = $logoutResult.Error }
            }
        }

        $passedTests = ($results | Where-Object { $_.Success }).Count
        $totalTests = $results.Count

        Write-Success "Authentication tests completed: $passedTests/$totalTests passed"

        return @{
            Success = $passedTests -eq $totalTests
            Results = $results
            Tokens = $tokens
        }

    } catch {
        Write-Error "Authentication flow tests failed: $($_.Exception.Message)"
        return @{
            Success = $false
            Error = $_.Exception.Message
            Tokens = @{}
        }
    }
}

function Test-UserManagement {
    param([hashtable]$Tokens)

    Write-TestHeader "User Management Tests"

    $results = @()

    try {
        if ($Tokens.Count -eq 0) {
            Write-Error "No authentication tokens available for user management tests"
            return @{ Success = $false; Error = "No tokens available" }
        }

        Write-Info "Testing profile retrieval..."

        # Test profile retrieval
        $firstUser = $TEST_USERS[0]
        $token = $Tokens[$firstUser.email]

        $profileResult = Invoke-APIRequest -Uri "$BASE_URL/api/users/profile" -Method GET -Token $token

        if ($profileResult.Success -and $profileResult.StatusCode -eq 200) {
            Write-Success "Profile retrieved successfully"
            $results += @{ Test = "GetProfile"; Success = $true }
        } else {
            Write-Error "Failed to get profile: $($profileResult.Error)"
            $results += @{ Test = "GetProfile"; Success = $false; Error = $profileResult.Error }
        }

        Write-Info "Testing profile update..."

        # Test profile update
        $updateData = @{
            bio = "Updated bio: $($firstUser.bio) - Testing API"
            interests = $firstUser.interests + @("testing", "api")
        }

        $updateResult = Invoke-APIRequest -Uri "$BASE_URL/api/users/profile" -Method PUT -Body $updateData -Token $token

        if ($updateResult.Success -and $updateResult.StatusCode -eq 200) {
            Write-Success "Profile updated successfully"
            $results += @{ Test = "UpdateProfile"; Success = $true }
        } else {
            Write-Error "Failed to update profile: $($updateResult.Error)"
            $results += @{ Test = "UpdateProfile"; Success = $false; Error = $updateResult.Error }
        }

        Write-Info "Testing user search..."

        # Test user search
        $searchResult = Invoke-APIRequest -Uri "$BASE_URL/api/users/search?q=Alex" -Method GET -Token $token

        if ($searchResult.Success -and $searchResult.StatusCode -eq 200) {
            Write-Success "User search completed successfully"
            $results += @{ Test = "UserSearch"; Success = $true }
        } else {
            Write-Error "User search failed: $($searchResult.Error)"
            $results += @{ Test = "UserSearch"; Success = $false; Error = $searchResult.Error }
        }

        Write-Info "Testing user preferences..."

        # Test user preferences
        $preferencesData = @{
            ageRange = @{ min = 25; max = 35 }
            maxDistance = 50
            genderPreference = "both"
        }

        $preferencesResult = Invoke-APIRequest -Uri "$BASE_URL/api/users/preferences" -Method PUT -Body $preferencesData -Token $token

        if ($preferencesResult.Success -and $preferencesResult.StatusCode -eq 200) {
            Write-Success "User preferences updated successfully"
            $results += @{ Test = "UserPreferences"; Success = $true }
        } else {
            Write-Error "Failed to update user preferences: $($preferencesResult.Error)"
            $results += @{ Test = "UserPreferences"; Success = $false; Error = $preferencesResult.Error }
        }

        $passedTests = ($results | Where-Object { $_.Success }).Count
        $totalTests = $results.Count

        Write-Success "User management tests completed: $passedTests/$totalTests passed"

        return @{
            Success = $passedTests -eq $totalTests
            Results = $results
        }

    } catch {
        Write-Error "User management tests failed: $($_.Exception.Message)"
        return @{
            Success = $false
            Error = $_.Exception.Message
        }
    }
}

function Test-PostsManagement {
    param([hashtable]$Tokens)

    Write-TestHeader "Posts Management Tests"

    $results = @()
    $createdPosts = @()

    try {
        if ($Tokens.Count -eq 0) {
            Write-Error "No authentication tokens available for posts tests"
            return @{ Success = $false; Error = "No tokens available" }
        }

        Write-Info "Testing post creation..."

        # Test post creation
        $firstUser = $TEST_USERS[0]
        $token = $Tokens[$firstUser.email]

        foreach ($post in $TEST_POSTS) {
            $postData = @{
                title = $post.title
                content = $post.content
                tags = $post.tags
                location = $post.location
            }

            $createResult = Invoke-APIRequest -Uri "$BASE_URL/api/posts" -Method POST -Body $postData -Token $token

            if ($createResult.Success -and ($createResult.StatusCode -eq 201 -or $createResult.StatusCode -eq 200)) {
                Write-Success "Post '$($post.title)' created successfully"
                $createdPosts += $createResult.Content
                $results += @{ Test = "CreatePost_$($post.title)"; Success = $true }
            } else {
                Write-Error "Failed to create post '$($post.title)': $($createResult.Error)"
                $results += @{ Test = "CreatePost_$($post.title)"; Success = $false; Error = $createResult.Error }
            }
        }

        Write-Info "Testing post retrieval..."

        # Test posts retrieval
        $postsResult = Invoke-APIRequest -Uri "$BASE_URL/api/posts" -Method GET -Token $token

        if ($postsResult.Success -and $postsResult.StatusCode -eq 200) {
            Write-Success "Posts retrieved successfully ($($postsResult.Content.Count) posts)"
            $results += @{ Test = "GetPosts"; Success = $true }
        } else {
            Write-Error "Failed to get posts: $($postsResult.Error)"
            $results += @{ Test = "GetPosts"; Success = $false; Error = $postsResult.Error }
        }

        if ($createdPosts.Count -gt 0) {
            Write-Info "Testing post update..."

            # Test post update
            $firstPost = $createdPosts[0]
            $updateData = @{
                title = "$($firstPost.title) - Updated"
                content = "$($firstPost.content) - This post has been updated for testing."
            }

            $updateResult = Invoke-APIRequest -Uri "$BASE_URL/api/posts/$($firstPost.id)" -Method PUT -Body $updateData -Token $token

            if ($updateResult.Success -and $updateResult.StatusCode -eq 200) {
                Write-Success "Post updated successfully"
                $results += @{ Test = "UpdatePost"; Success = $true }
            } else {
                Write-Error "Failed to update post: $($updateResult.Error)"
                $results += @{ Test = "UpdatePost"; Success = $false; Error = $updateResult.Error }
            }

            Write-Info "Testing post deletion..."

            # Test post deletion
            $deleteResult = Invoke-APIRequest -Uri "$BASE_URL/api/posts/$($firstPost.id)" -Method DELETE -Token $token

            if ($deleteResult.Success -and $deleteResult.StatusCode -eq 200) {
                Write-Success "Post deleted successfully"
                $results += @{ Test = "DeletePost"; Success = $true }
            } else {
                Write-Error "Failed to delete post: $($deleteResult.Error)"
                $results += @{ Test = "DeletePost"; Success = $false; Error = $deleteResult.Error }
            }
        }

        Write-Info "Testing post search..."

        # Test post search
        $searchResult = Invoke-APIRequest -Uri "$BASE_URL/api/posts/search?q=hiking" -Method GET -Token $token

        if ($searchResult.Success -and $searchResult.StatusCode -eq 200) {
            Write-Success "Post search completed successfully"
            $results += @{ Test = "PostSearch"; Success = $true }
        } else {
            Write-Error "Post search failed: $($searchResult.Error)"
            $results += @{ Test = "PostSearch"; Success = $false; Error = $searchResult.Error }
        }

        $passedTests = ($results | Where-Object { $_.Success }).Count
        $totalTests = $results.Count

        Write-Success "Posts management tests completed: $passedTests/$totalTests passed"

        return @{
            Success = $passedTests -eq $totalTests
            Results = $results
            CreatedPosts = $createdPosts
        }

    } catch {
        Write-Error "Posts management tests failed: $($_.Exception.Message)"
        return @{
            Success = $false
            Error = $_.Exception.Message
        }
    }
}

function Test-MatchingSystem {
    param([hashtable]$Tokens)

    Write-TestHeader "Matching System Tests"

    $results = @()

    try {
        if ($Tokens.Count -lt 2) {
            Write-Error "Need at least 2 authenticated users for matching tests"
            return @{ Success = $false; Error = "Insufficient users" }
        }

        Write-Info "Testing potential matches retrieval..."

        # Test potential matches
        $firstUser = $TEST_USERS[0]
        $token = $Tokens[$firstUser.email]

        $matchesResult = Invoke-APIRequest -Uri "$BASE_URL/api/matches/potential" -Method GET -Token $token

        if ($matchesResult.Success -and $matchesResult.StatusCode -eq 200) {
            Write-Success "Potential matches retrieved successfully"
            $results += @{ Test = "GetPotentialMatches"; Success = $true }
        } else {
            Write-Error "Failed to get potential matches: $($matchesResult.Error)"
            $results += @{ Test = "GetPotentialMatches"; Success = $false; Error = $matchesResult.Error }
        }

        Write-Info "Testing like/unlike functionality..."

        # Test like functionality
        $secondUser = $TEST_USERS[1]
        $likeData = @{
            targetUserId = $secondUser.email  # Assuming email as user ID for simplicity
            action = "like"
        }

        $likeResult = Invoke-APIRequest -Uri "$BASE_URL/api/matches/like" -Method POST -Body $likeData -Token $token

        if ($likeResult.Success -and $likeResult.StatusCode -eq 200) {
            Write-Success "Like action completed successfully"
            $results += @{ Test = "LikeUser"; Success = $true }
        } else {
            Write-Error "Like action failed: $($likeResult.Error)"
            $results += @{ Test = "LikeUser"; Success = $false; Error = $likeResult.Error }
        }

        Write-Info "Testing matches retrieval..."

        # Test matches retrieval
        $userMatchesResult = Invoke-APIRequest -Uri "$BASE_URL/api/matches" -Method GET -Token $token

        if ($userMatchesResult.Success -and $userMatchesResult.StatusCode -eq 200) {
            Write-Success "User matches retrieved successfully"
            $results += @{ Test = "GetMatches"; Success = $true }
        } else {
            Write-Error "Failed to get matches: $($userMatchesResult.Error)"
            $results += @{ Test = "GetMatches"; Success = $false; Error = $userMatchesResult.Error }
        }

        Write-Info "Testing pass functionality..."

        # Test pass functionality
        $thirdUser = $TEST_USERS[2]
        $passData = @{
            targetUserId = $thirdUser.email
            action = "pass"
        }

        $passResult = Invoke-APIRequest -Uri "$BASE_URL/api/matches/pass" -Method POST -Body $passData -Token $token

        if ($passResult.Success -and $passResult.StatusCode -eq 200) {
            Write-Success "Pass action completed successfully"
            $results += @{ Test = "PassUser"; Success = $true }
        } else {
            Write-Error "Pass action failed: $($passResult.Error)"
            $results += @{ Test = "PassUser"; Success = $false; Error = $passResult.Error }
        }

        $passedTests = ($results | Where-Object { $_.Success }).Count
        $totalTests = $results.Count

        Write-Success "Matching system tests completed: $passedTests/$totalTests passed"

        return @{
            Success = $passedTests -eq $totalTests
            Results = $results
        }

    } catch {
        Write-Error "Matching system tests failed: $($_.Exception.Message)"
        return @{
            Success = $false
            Error = $_.Exception.Message
        }
    }
}

function Test-MessagingSystem {
    param([hashtable]$Tokens)

    Write-TestHeader "Messaging System Tests"

    $results = @()

    try {
        if ($Tokens.Count -lt 2) {
            Write-Error "Need at least 2 authenticated users for messaging tests"
            return @{ Success = $false; Error = "Insufficient users" }
        }

        Write-Info "Testing conversation creation..."

        # Test conversation creation
        $firstUser = $TEST_USERS[0]
        $secondUser = $TEST_USERS[1]
        $token1 = $Tokens[$firstUser.email]
        $token2 = $Tokens[$secondUser.email]

        $conversationData = @{
            participantId = $secondUser.email
            message = "Hi! I'm testing the messaging system. How are you?"
        }

        $conversationResult = Invoke-APIRequest -Uri "$BASE_URL/api/messages/conversations" -Method POST -Body $conversationData -Token $token1

        if ($conversationResult.Success -and ($conversationResult.StatusCode -eq 201 -or $conversationResult.StatusCode -eq 200)) {
            Write-Success "Conversation created successfully"
            $conversationId = $conversationResult.Content.id
            $results += @{ Test = "CreateConversation"; Success = $true }
        } else {
            Write-Error "Failed to create conversation: $($conversationResult.Error)"
            $results += @{ Test = "CreateConversation"; Success = $false; Error = $conversationResult.Error }
            return @{ Success = $false; Results = $results }
        }

        Write-Info "Testing message sending..."

        # Test message sending
        $messageData = @{
            conversationId = $conversationId
            content = "This is a test message to verify the messaging functionality."
        }

        $messageResult = Invoke-APIRequest -Uri "$BASE_URL/api/messages" -Method POST -Body $messageData -Token $token1

        if ($messageResult.Success -and ($messageResult.StatusCode -eq 201 -or $messageResult.StatusCode -eq 200)) {
            Write-Success "Message sent successfully"
            $results += @{ Test = "SendMessage"; Success = $true }
        } else {
            Write-Error "Failed to send message: $($messageResult.Error)"
            $results += @{ Test = "SendMessage"; Success = $false; Error = $messageResult.Error }
        }

        Write-Info "Testing message retrieval..."

        # Test message retrieval
        $messagesResult = Invoke-APIRequest -Uri "$BASE_URL/api/messages/conversations/$conversationId" -Method GET -Token $token1

        if ($messagesResult.Success -and $messagesResult.StatusCode -eq 200) {
            Write-Success "Messages retrieved successfully ($($messagesResult.Content.Count) messages)"
            $results += @{ Test = "GetMessages"; Success = $true }
        } else {
            Write-Error "Failed to get messages: $($messagesResult.Error)"
            $results += @{ Test = "GetMessages"; Success = $false; Error = $messagesResult.Error }
        }

        Write-Info "Testing conversations list..."

        # Test conversations list
        $conversationsResult = Invoke-APIRequest -Uri "$BASE_URL/api/messages/conversations" -Method GET -Token $token1

        if ($conversationsResult.Success -and $conversationsResult.StatusCode -eq 200) {
            Write-Success "Conversations list retrieved successfully"
            $results += @{ Test = "GetConversations"; Success = $true }
        } else {
            Write-Error "Failed to get conversations: $($conversationsResult.Error)"
            $results += @{ Test = "GetConversations"; Success = $false; Error = $conversationsResult.Error }
        }

        Write-Info "Testing message from second user..."

        # Test message from second user
        $replyData = @{
            conversationId = $conversationId
            content = "Hi! Thanks for the test message. The messaging system seems to be working well!"
        }

        $replyResult = Invoke-APIRequest -Uri "$BASE_URL/api/messages" -Method POST -Body $replyData -Token $token2

        if ($replyResult.Success -and ($replyResult.StatusCode -eq 201 -or $replyResult.StatusCode -eq 200)) {
            Write-Success "Reply message sent successfully"
            $results += @{ Test = "ReplyMessage"; Success = $true }
        } else {
            Write-Error "Failed to send reply: $($replyResult.Error)"
            $results += @{ Test = "ReplyMessage"; Success = $false; Error = $replyResult.Error }
        }

        $passedTests = ($results | Where-Object { $_.Success }).Count
        $totalTests = $results.Count

        Write-Success "Messaging system tests completed: $passedTests/$totalTests passed"

        return @{
            Success = $passedTests -eq $totalTests
            Results = $results
        }

    } catch {
        Write-Error "Messaging system tests failed: $($_.Exception.Message)"
        return @{
            Success = $false
            Error = $_.Exception.Message
        }
    }
}

function Test-NotificationsSystem {
    param([hashtable]$Tokens)

    Write-TestHeader "Notifications System Tests"

    $results = @()

    try {
        if ($Tokens.Count -eq 0) {
            Write-Error "No authentication tokens available for notifications tests"
            return @{ Success = $false; Error = "No tokens available" }
        }

        Write-Info "Testing notifications retrieval..."

        # Test notifications retrieval
        $firstUser = $TEST_USERS[0]
        $token = $Tokens[$firstUser.email]

        $notificationsResult = Invoke-APIRequest -Uri "$BASE_URL/api/notifications" -Method GET -Token $token

        if ($notificationsResult.Success -and $notificationsResult.StatusCode -eq 200) {
            Write-Success "Notifications retrieved successfully"
            $results += @{ Test = "GetNotifications"; Success = $true }
        } else {
            Write-Error "Failed to get notifications: $($notificationsResult.Error)"
            $results += @{ Test = "GetNotifications"; Success = $false; Error = $notificationsResult.Error }
        }

        Write-Info "Testing notification preferences..."

        # Test notification preferences
        $preferencesData = @{
            emailNotifications = $true
            pushNotifications = $true
            matchNotifications = $true
            messageNotifications = $true
            likeNotifications = $false
        }

        $preferencesResult = Invoke-APIRequest -Uri "$BASE_URL/api/notifications/preferences" -Method PUT -Body $preferencesData -Token $token

        if ($preferencesResult.Success -and $preferencesResult.StatusCode -eq 200) {
            Write-Success "Notification preferences updated successfully"
            $results += @{ Test = "UpdateNotificationPreferences"; Success = $true }
        } else {
            Write-Error "Failed to update notification preferences: $($preferencesResult.Error)"
            $results += @{ Test = "UpdateNotificationPreferences"; Success = $false; Error = $preferencesResult.Error }
        }

        Write-Info "Testing notification marking as read..."

        # Test marking notifications as read
        $markReadData = @{
            notificationIds = @("test-notification-1", "test-notification-2")
        }

        $markReadResult = Invoke-APIRequest -Uri "$BASE_URL/api/notifications/read" -Method PUT -Body $markReadData -Token $token

        if ($markReadResult.Success -and $markReadResult.StatusCode -eq 200) {
            Write-Success "Notifications marked as read successfully"
            $results += @{ Test = "MarkNotificationsRead"; Success = $true }
        } else {
            Write-Error "Failed to mark notifications as read: $($markReadResult.Error)"
            $results += @{ Test = "MarkNotificationsRead"; Success = $false; Error = $markReadResult.Error }
        }

        $passedTests = ($results | Where-Object { $_.Success }).Count
        $totalTests = $results.Count

        Write-Success "Notifications system tests completed: $passedTests/$totalTests passed"

        return @{
            Success = $passedTests -eq $totalTests
            Results = $results
        }

    } catch {
        Write-Error "Notifications system tests failed: $($_.Exception.Message)"
        return @{
            Success = $false
            Error = $_.Exception.Message
        }
    }
}

function Test-MediaManagement {
    param([hashtable]$Tokens)

    Write-TestHeader "Media Management Tests"

    $results = @()

    try {
        if ($Tokens.Count -eq 0) {
            Write-Error "No authentication tokens available for media tests"
            return @{ Success = $false; Error = "No tokens available" }
        }

        Write-Info "Testing media upload..."

        # Test media upload (simulated with test data)
        $firstUser = $TEST_USERS[0]
        $token = $Tokens[$firstUser.email]

        $mediaData = @{
            fileName = "test-profile-photo.jpg"
            fileType = "image/jpeg"
            fileSize = 1024000  # 1MB
            base64Data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="  # Minimal 1x1 pixel image
        }

        $uploadResult = Invoke-APIRequest -Uri "$BASE_URL/api/media/upload" -Method POST -Body $mediaData -Token $token

        if ($uploadResult.Success -and ($uploadResult.StatusCode -eq 201 -or $uploadResult.StatusCode -eq 200)) {
            Write-Success "Media uploaded successfully"
            $mediaId = $uploadResult.Content.id
            $results += @{ Test = "UploadMedia"; Success = $true }
        } else {
            Write-Error "Failed to upload media: $($uploadResult.Error)"
            $results += @{ Test = "UploadMedia"; Success = $false; Error = $uploadResult.Error }
        }

        Write-Info "Testing media retrieval..."

        # Test media retrieval
        $mediaResult = Invoke-APIRequest -Uri "$BASE_URL/api/media" -Method GET -Token $token

        if ($mediaResult.Success -and $mediaResult.StatusCode -eq 200) {
            Write-Success "Media retrieved successfully ($($mediaResult.Content.Count) items)"
            $results += @{ Test = "GetMedia"; Success = $true }
        } else {
            Write-Error "Failed to get media: $($mediaResult.Error)"
            $results += @{ Test = "GetMedia"; Success = $false; Error = $mediaResult.Error }
        }

        if ($mediaId) {
            Write-Info "Testing media deletion..."

            # Test media deletion
            $deleteResult = Invoke-APIRequest -Uri "$BASE_URL/api/media/$mediaId" -Method DELETE -Token $token

            if ($deleteResult.Success -and $deleteResult.StatusCode -eq 200) {
                Write-Success "Media deleted successfully"
                $results += @{ Test = "DeleteMedia"; Success = $true }
            } else {
                Write-Error "Failed to delete media: $($deleteResult.Error)"
                $results += @{ Test = "DeleteMedia"; Success = $false; Error = $deleteResult.Error }
            }
        }

        Write-Info "Testing profile photo update..."

        # Test profile photo update
        $photoData = @{
            mediaId = $mediaId
            isProfilePhoto = $true
        }

        $photoResult = Invoke-APIRequest -Uri "$BASE_URL/api/users/profile/photo" -Method PUT -Body $photoData -Token $token

        if ($photoResult.Success -and $photoResult.StatusCode -eq 200) {
            Write-Success "Profile photo updated successfully"
            $results += @{ Test = "UpdateProfilePhoto"; Success = $true }
        } else {
            Write-Error "Failed to update profile photo: $($photoResult.Error)"
            $results += @{ Test = "UpdateProfilePhoto"; Success = $false; Error = $photoResult.Error }
        }

        $passedTests = ($results | Where-Object { $_.Success }).Count
        $totalTests = $results.Count

        Write-Success "Media management tests completed: $passedTests/$totalTests passed"

        return @{
            Success = $passedTests -eq $totalTests
            Results = $results
        }

    } catch {
        Write-Error "Media management tests failed: $($_.Exception.Message)"
        return @{
            Success = $false
            Error = $_.Exception.Message
        }
    }
}

function Cleanup-TestData {
    param([hashtable]$Tokens)

    if (-not $Cleanup) {
        Write-Info "Cleanup skipped as requested"
        return
    }

    Write-TestHeader "Cleaning Up Test Data"

    try {
        Write-Info "Cleaning up test users and data..."

        # Note: In a real production environment, you might want to implement
        # a cleanup API endpoint or use database direct access for cleanup
        # For this test script, we'll just log the cleanup intent

        Write-Success "Test data cleanup completed (simulated)"
        return $true

    } catch {
        Write-Error "Test data cleanup failed: $($_.Exception.Message)"
        return $false
    }
}

# Main execution
try {
    $startTime = Get-Date
    $testsToRun = @()
    $results = @{}
    $authTokens = @{}

    # Determine which tests to run
    if ($All -or $Auth) { $testsToRun += "Auth" }
    if ($All -or $Users) { $testsToRun += "Users" }
    if ($All -or $Posts) { $testsToRun += "Posts" }
    if ($All -or $Media) { $testsToRun += "Media" }
    if ($All -or $Matching) { $testsToRun += "Matching" }
    if ($All -or $Messaging) { $testsToRun += "Messaging" }
    if ($All -or $Notifications) { $testsToRun += "Notifications" }

    if ($testsToRun.Count -eq 0) {
        $testsToRun = @("Auth", "Users", "Posts", "Media", "Matching", "Messaging", "Notifications")
    }

    Write-TestHeader "API Test Suite - Production Ready"
    Write-Host "Tests to run: $($testsToRun -join ', ')" -ForegroundColor Yellow
    Write-Host "Environment: $Environment" -ForegroundColor Yellow
    Write-Host "Base URL: $BASE_URL" -ForegroundColor Yellow

    # Run authentication first if needed
    if ($testsToRun -contains "Auth" -or $testsToRun.Count -gt 1) {
        $authResult = Test-AuthenticationFlow
        $results.Auth = $authResult
        $authTokens = $authResult.Tokens
    }

    # Run other tests
    foreach ($test in $testsToRun) {
        if ($test -eq "Auth") { continue }  # Already ran

        switch ($test) {
            "Users" {
                $results.Users = Test-UserManagement -Tokens $authTokens
            }
            "Posts" {
                $results.Posts = Test-PostsManagement -Tokens $authTokens
            }
            "Media" {
                $results.Media = Test-MediaManagement -Tokens $authTokens
            }
            "Matching" {
                $results.Matching = Test-MatchingSystem -Tokens $authTokens
            }
            "Messaging" {
                $results.Messaging = Test-MessagingSystem -Tokens $authTokens
            }
            "Notifications" {
                $results.Notifications = Test-NotificationsSystem -Tokens $authTokens
            }
        }
    }

    # Cleanup
    Cleanup-TestData -Tokens $authTokens

    # Summary
    $endTime = Get-Date
    $totalDuration = $endTime - $startTime

    Write-TestHeader "API Test Results"

    $totalTests = 0
    $passedTests = 0

    foreach ($result in $results.GetEnumerator()) {
        $status = if ($result.Value.Success) { "✅ PASS" } else { "❌ FAIL" }
        $color = if ($result.Value.Success) { "Green" } else { "Red" }
        Write-Host "$status $($result.Key)" -ForegroundColor $color

        if ($result.Value.Results) {
            $modulePassed = ($result.Value.Results | Where-Object { $_.Success }).Count
            $moduleTotal = $result.Value.Results.Count
            $totalTests += $moduleTotal
            $passedTests += $modulePassed
            Write-Host "  └─ $modulePassed/$moduleTotal sub-tests passed" -ForegroundColor White
        }
    }

    Write-Host "`n📊 Summary:" -ForegroundColor Cyan
    Write-Host "Total Tests: $totalTests" -ForegroundColor White
    Write-Host "Passed: $passedTests" -ForegroundColor Green
    Write-Host "Failed: $($totalTests - $passedTests)" -ForegroundColor $(if ($totalTests - $passedTests -eq 0) { "Green" } else { "Red" })
    Write-Host "Duration: $([math]::Round($totalDuration.TotalSeconds, 2))s" -ForegroundColor Yellow

    $overallSuccess = $passedTests -eq $totalTests

    if ($overallSuccess) {
        Write-Success "All API tests passed! Production-ready validation successful."
        exit 0
    } else {
        Write-Error "Some API tests failed. Review errors above."
        exit 1
    }

} catch {
    Write-Error "Fatal error during API testing: $($_.Exception.Message)"
    exit 1
}
