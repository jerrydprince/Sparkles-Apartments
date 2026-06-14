<?php
header("Content-Type: text/plain");
echo "Diagnostics:\n";

$dirs = [
    '/home/sparkle7/public_html/api/',
    '/home/sparkle7/public_html/gittest.sparklesapartments.ng/api/',
    '/home/sparkle7/public_html/test.sparklesapartments.ng/api/'
];

foreach ($dirs as $dir) {
    echo "\nListing: $dir\n";
    if (is_dir($dir)) {
        $files = scandir($dir);
        foreach ($files as $file) {
            $fullPath = $dir . $file;
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
