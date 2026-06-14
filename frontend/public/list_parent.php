<?php
header("Content-Type: text/plain");
echo "Recursive search for clean.php in /home/sparkle7/ (excluding public_html to prevent timeouts):\n";

function find_clean_php($dir) {
    if (!is_dir($dir)) return;
    
    // Exclude directories to avoid massive scans
    $exclude = ['.git', 'node_modules', 'public_html', '.cagefs', '.cpanel', 'mail'];
    
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

find_clean_php('/home/sparkle7');
echo "\nSearch complete.\n";
