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
$output = [];
$return_var = 0;

exec('git fetch origin main 2>&1', $output, $return_var);
exec('git reset --hard origin/main 2>&1', $output, $return_var);

// If cPanel Version Control is configured, it will run .cpanel.yml automatically on pull/update
echo "\nCommand Output:\n";
echo implode("\n", $output);

if ($return_var === 0) {
    echo "\n\nDeployment Completed Successfully!";
} else {
    echo "\n\nDeployment Failed with code: " . $return_var;
}
