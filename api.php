
<?php
/**
 * BUILDING DEVELOPMENTS & TECHNOLOGIES LEDGER - PHP STORAGE BRIDGE
 * Purpose: Provides a persistence layer for the React frontend.
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$storageFile = 'ledger_store.json';

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

// GET: Retrieve the latest ledger snapshot
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (file_exists($storageFile)) {
        echo file_get_contents($storageFile);
    } else {
        echo json_encode(["status" => "error", "message" => "No snapshot found"]);
    }
    exit;
}

// POST: Commit a new ledger snapshot
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if ($data) {
        // Add server-side timestamp for audit trail
        $data['server_commit_ts'] = date('Y-m-d H:i:s');
        
        if (file_put_contents($storageFile, json_encode($data, JSON_PRETTY_PRINT))) {
            echo json_encode(["status" => "success", "message" => "Ledger committed to enterprise storage"]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "File write failure"]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Malformed payload"]);
    }
    exit;
}
?>
