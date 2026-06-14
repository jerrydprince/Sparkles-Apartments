<?php
header("Content-Type: text/plain");
echo "Recursive search for clean.php under public_html (excluding wordpress core/content directories):\n";

function find_clean_php($dir) {
    if (!is_dir($dir)) return;
    
    $exclude = ['wp-admin', 'wp-includes', 'wp-content', '.git', 'node_modules'];
    
    $files = @scandir($dir);
    if ($files === false) return;
    
    foreach ($files as $file) {
        if ($file === '.' || $file === '..') continue;
        
        $path = $dir . '/' . $file;
        if (is_dir($path)) {
            if (in_array($file, $exclude)) continue;
            find_clean_php($path);
        } else if ($file === 'clean.php') {
            echo "\nFOUND: $path\n";
            echo "----------------------------------------\n";
            echo @file_get_contents($path) . "\n";
            echo "----------------------------------------\n";
        }
    }
}

find_clean_php('/home/sparkle7/public_html');
echo "\nSearch complete.\n";
