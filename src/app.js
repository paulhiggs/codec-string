
import { BREAK } from './markup.js';
import { decode } from './decode.js';

function checkCodec() {
  const val = document.getElementById("param").value;
  const res = decode(val);
  document.getElementById("results").innerHTML="<hr><h2>Results</h2>"+BREAK+res;
}

(function() {
  let done = false;
  function addClickListener() {
    if (!done && document.readyState !== 'loading') {
      done = true;
      document.getElementById('check-codec').addEventListener('click', checkCodec);
    }
  }
  document.addEventListener('readystatechange', addClickListener);
  addClickListener();
})();

