let r = await fetch("https://cdn.muzpan.net/?h=JGraYpdVSLVHJPvqErilkeKe4Tq_2eInf3ntqNxwUdq2ekJz-6DcZXsQY4O5JUoC2Ed33nlibosof5B7bS_2kiIn", {
  "headers": {
    "accept": "*/*",
    "accept-language": "ru",
    "cache-control": "no-cache",
    "pragma": "no-cache",
    "priority": "i",
    "range": "bytes=0-",
    "sec-ch-ua": "\"Not/A)Brand\";v=\"8\", \"Chromium\";v=\"126\", \"YaBrowser\";v=\"24.7\", \"Yowser\";v=\"2.5\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"macOS\"",
    "sec-fetch-dest": "audio",
    "sec-fetch-mode": "no-cors",
    "sec-fetch-site": "same-site",
    "Referer": "https://muzpan.net/",
    "Referrer-Policy": "strict-origin-when-cross-origin"
  },
  "body": null,
  "method": "GET"
});


console.log(r);