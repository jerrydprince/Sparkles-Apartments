<?php
/**
 * Simple Secure Git Deployment Script for cPanel
 * Reference: https://docs.cpanel.net/knowledge-base/general-systems-administration/guide-to-git-set-up-deployment/
 */

// Define your secret security token here
define('DEPLOY_TOKEN', 'sparkles_secure_deploy_2026_token');

// Validate the token passed in the URL
if (!isset($_GET['token']) || $_GET['token'] !== DEPLOY_TOKEN) {
    header('HTTP/1.1 403 Forbidden');
    echo 'Access Denied: Invalid Security Token';
    exit;
}

echo "Starting Git Deployment...\n";

// Execute git commands to pull latest changes from GitHub
// We run reset --hard to discard any local permission drift on the host
$repoPath = '/home/sparkle7/repositories/Sparkles-Hotel-Booking';
if (!file_exists($repoPath)) {
    $repoPath = '/home/sparkle7/Sparkles-Hotel-Booking';
}

if (chdir($repoPath)) {
    exec('git fetch origin main 2>&1', $output, $return_var);
    exec('git reset --hard origin/main 2>&1', $output, $return_var);
    
    if ($return_var === 0) {
        // Copy the compiled assets and the hidden .htaccess to the subdomain folder
        exec('/bin/cp -R frontend/dist/* /home/sparkle7/public_html/gittest.sparklesapartments.ng/ 2>&1', $output, $return_var);
        exec('/bin/cp frontend/dist/.htaccess /home/sparkle7/public_html/gittest.sparklesapartments.ng/ 2>&1', $output, $return_var);
    }
} else {
    $return_var = 1;
    $output[] = "Error: Could not chdir to repository path: $repoPath";
}

// If cPanel Version Control is configured, it will run .cpanel.yml automatically on pull/update
echo "\nCommand Output:\n";
echo implode("\n", $output);

if ($return_var === 0) {
    echo "\n\nDeployment Completed Successfully!";
} else {
    echo "\n\nDeployment Failed with code: " . $return_var;
}
