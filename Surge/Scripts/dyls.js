let obj = JSON.parse($response.body);

$done({body:JSON.stringify(obj)});
