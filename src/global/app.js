(function () {
	var done = false;

	function checkCodec() {
		var val = document.getElementById('param').value;
		var res = window.CodecString.decode(val);
		document.getElementById('results').innerHTML =
			'<hr><h2>Results</h2><br>' + res;
	}

	function addClickListener() {
		if (!done && document.readyState !== 'loading') {
			done = true;
			document
				.getElementById('check-codec')
				.addEventListener('click', checkCodec);
		}
	}
	document.addEventListener('readystatechange', addClickListener);
	addClickListener();
})();
