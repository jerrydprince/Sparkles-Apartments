<?php
header("Content-Type: text/plain");
echo "Diagnostics:\n";
echo "PHP User: " . exec('whoami') . "\n";
echo "Current User ID: " . getmyuid() . "\n";
echo "File Owner ID: " . fileowner(__FILE__) . "\n";

$paths = [
    '/home/sparkle7/',
    '/home/sparkle7/public_html/',
    '/home/sparkle7/public_html/gittest.sparklesapartments.ng/',
    dirname(__DIR__) . '/'
];

foreach ($paths as $path) {
    echo "\nListing: $path\n";
    if (is_dir($path)) {
        $files = scandir($path);
        foreach ($files as $file) {
            $fullPath = $path . $file;
            if (is_file($fullPath)) {
                $owner = function_exists('posix_getpwuid') ? posix_getpwuid(fileowner($fullPath))['name'] : fileowner($fullPath);
                echo "  $file (" . filesize($fullPath) . " bytes) - Owner: $owner\n";
                if ($file === 'clean.php') {
                    echo "--- CONTENTS OF clean.php ---\n";
                    echo file_get_contents($fullPath) . "\n";
                    echo "-----------------------------\n";
                }
            } else {
                echo "  $file/ [DIR]\n";
            }
        }
    } else {
        echo "  Directory does not exist.\n";
    }
}
