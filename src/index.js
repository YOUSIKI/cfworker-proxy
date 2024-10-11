export default {
	async fetch(request, env, ctx) {
		try {
			const url = new URL(request.url);

			// If accessing the root directory, return HTML
			if (url.pathname === '/') {
				return new Response(getRootHtml(), {
					headers: {
						'Content-Type': 'text/html; charset=utf-8',
					},
				});
			}

			// Extract the target URL from the request path
			let actualUrlStr = decodeURIComponent(url.pathname.replace('/', ''));

			// Ensure the user input URL has a protocol
			actualUrlStr = ensureProtocol(actualUrlStr, url.protocol);

			// Preserve query parameters
			actualUrlStr += url.search;

			// Create a new Headers object, excluding headers starting with 'cf-'
			const newHeaders = filterHeaders(request.headers, (name) => !name.startsWith('cf-'));

			// Create a new request to access the target URL
			const modifiedRequest = new Request(actualUrlStr, {
				headers: newHeaders,
				method: request.method,
				body: request.body,
				redirect: 'manual',
			});

			// Make a request to the target URL
			const response = await fetch(modifiedRequest);
			let body = response.body;

			// Handle redirects
			if ([301, 302, 303, 307, 308].includes(response.status)) {
				body = response.body;
				// Create a new Response object to modify the Location header
				return handleRedirect(response, body);
			} else if (response.headers.get('Content-Type')?.includes('text/html')) {
				body = await handleHtmlContent(response, url.protocol, url.host, actualUrlStr);
			}

			// Create the modified response object
			const modifiedResponse = new Response(body, {
				status: response.status,
				statusText: response.statusText,
				headers: response.headers,
			});

			// Add no-cache headers
			setNoCacheHeaders(modifiedResponse.headers);

			// Add CORS headers to allow cross-origin access
			setCorsHeaders(modifiedResponse.headers);

			return modifiedResponse;
		} catch (error) {
			// If an error occurs when requesting the target address, return a response with the error message and status code 500 (server error)
			return jsonResponse(
				{
					error: error.message,
				},
				500
			);
		}
	},
};

// Ensure the URL has a protocol
function ensureProtocol(url, defaultProtocol) {
	return url.startsWith('http://') || url.startsWith('https://') ? url : defaultProtocol + '//' + url;
}

// Handle redirects
function handleRedirect(response, body) {
	const location = new URL(response.headers.get('location'));
	const modifiedLocation = `/${encodeURIComponent(location.toString())}`;
	return new Response(body, {
		status: response.status,
		statusText: response.statusText,
		headers: {
			...response.headers,
			Location: modifiedLocation,
		},
	});
}

// Handle relative paths in HTML content
async function handleHtmlContent(response, protocol, host, actualUrlStr) {
	const originalText = await response.text();
	const regex = new RegExp('((href|src|action)=["\'])/(?!/)', 'g');
	let modifiedText = replaceRelativePaths(originalText, protocol, host, new URL(actualUrlStr).origin);

	return modifiedText;
}

// Replace relative paths in HTML content
function replaceRelativePaths(text, protocol, host, origin) {
	const regex = new RegExp('((href|src|action)=["\'])/(?!/)', 'g');
	return text.replace(regex, `$1${protocol}//${host}/${origin}/`);
}

// Return a JSON response
function jsonResponse(data, status) {
	return new Response(JSON.stringify(data), {
		status: status,
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
		},
	});
}

// Filter request headers
function filterHeaders(headers, filterFunc) {
	return new Headers([...headers].filter(([name]) => filterFunc(name)));
}

// Set no-cache headers
function setNoCacheHeaders(headers) {
	headers.set('Cache-Control', 'no-store');
}

// Set CORS headers
function setCorsHeaders(headers) {
	headers.set('Access-Control-Allow-Origin', '*');
	headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
	headers.set('Access-Control-Allow-Headers', '*');
}

// Return HTML for the root directory
function getRootHtml() {
	return `<!DOCTYPE html>
  <html lang="zh-CN">
  <head>
	<meta charset="UTF-8">
	<link href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css" rel="stylesheet">
	<title>Proxy Everything</title>
	<link rel="icon" type="image/png" href="https://img.icons8.com/color/1000/kawaii-bread-1.png">
	<meta name="Description" content="Proxy Everything with CF Workers.">
	<meta property="og:description" content="Proxy Everything with CF Workers.">
	<meta property="og:image" content="https://img.icons8.com/color/1000/kawaii-bread-1.png">
	<meta name="robots" content="index, follow">
	<meta http-equiv="Content-Language" content="zh-CN">
	<meta name="copyright" content="Copyright © ymyuuu">
	<meta name="author" content="ymyuuu">
	<link rel="apple-touch-icon-precomposed" sizes="120x120" href="https://img.icons8.com/color/1000/kawaii-bread-1.png">
	<meta name="apple-mobile-web-app-capable" content="yes">
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
	<meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no">
	<style>
		body, html {
			height: 100%;
			margin: 0;
		}
		.background {
			background-image: url('https://imgapi.cn/bing.php');
			background-size: cover;
			background-position: center;
			height: 100%;
			display: flex;
			align-items: center;
			justify-content: center;
		}
		.card {
			background-color: rgba(255, 255, 255, 0.8);
			transition: background-color 0.3s ease, box-shadow 0.3s ease;
		}
		.card:hover {
			background-color: rgba(255, 255, 255, 1);
			box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.3);
		}
		.input-field input[type=text] {
			color: #2c3e50;
		}
		.input-field input[type=text]:focus+label {
			color: #2c3e50 !important;
		}
		.input-field input[type=text]:focus {
			border-bottom: 1px solid #2c3e50 !important;
			box-shadow: 0 1px 0 0 #2c3e50 !important;
		}
	</style>
  </head>
  <body>
	<div class="background">
		<div class="container">
			<div class="row">
				<div class="col s12 m8 offset-m2 l6 offset-l3">
					<div class="card">
						<div class="card-content">
							<span class="card-title center-align"><i class="material-icons left">link</i>Proxy Everything</span>
							<form id="urlForm" onsubmit="redirectToProxy(event)">
								<div class="input-field">
									<input type="text" id="targetUrl" placeholder="Enter target URL here" required>
									<label for="targetUrl">Target URL</label>
								</div>
								<button type="submit" class="btn waves-effect waves-light teal darken-2 full-width">Go</button>
							</form>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js"></script>
	<script>
		function redirectToProxy(event) {
			event.preventDefault();
			const targetUrl = document.getElementById('targetUrl').value.trim();
			const currentOrigin = window.location.origin;
			window.open(currentOrigin + '/' + encodeURIComponent(targetUrl), '_blank');
		}
	</script>
  </body>
  </html>`;
}
