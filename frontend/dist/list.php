<?php
$dir = '/home/sparkle7/public_html/gittest.sparklesapartments.ng/';
echo "Directory listing for: $dir\n\n";

if (is_dir($dir)) {
    $files = scandir($dir);
    foreach ($files as $file) {
        $filePath = $dir . $file;
        $size = is_file($filePath) ? filesize($filePath) . " bytes" : "[DIR]";
        $perms = substr(sprintf('%o', fileperms($filePath)), -4);
        echo sprintf("%-40s %-15s %s\n", $file, $size, $perms);
    }
} else {
    echo "Error: Directory does not exist.";
}
