import { decode } from 'codec-string';

// get input value
const inp = document.querySelector('#check-codec .input');

// destination HTML element
const results = document.querySelector('#check-codec .results');

// clean up the text from the input
const codec = inp.textContent.trim();

// put the decoded codec info in to results
results.innerHTML = decode(codec).toHTML();
