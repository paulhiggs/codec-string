# codec-string
decode the codec= string in a media mime type

supports
* HEVC (hvc1, hev1)
* AVC (avc1)
* AAC (mp4a)
* AV1 and IAMF from AOMedia
* E-AC3 (ec-3)
* VP9
* EVC - refer annex E.9 of ISO/IEC 14496-15:2022
* VVC - refer annex E.6 of ISO/IEC 14496-15:2022
* MPEG-H
* AVS3 video and audio
* AVS2 audio
* LCEVC - refer to ISO/IEC 14496-15:2022 Amd.1
* HDR Vivid - refer to T/UWA 005-2.1

## Installation

* Install [nodejs](https://nodejs.org/en)
* Install required packages:

```sh
npm ci
```

Create the `codec-string.js` bundles:

```sh
npm run build
```

This will produce a `dist` directory with three different flavors of
package:

* ESM module (in the `dist/esm` directory)
* CommonJS module (in the `dist/cjs` directory)
* Legacy global namespace (in the `dist/script` directory)

Each directory will contain a `codec-string.js` file containing the
library and an example application (`app.js` and `index.html`).

## Usage

### ESM module in a browser

```javascript
import { decode } from 'esm/codec-string.js';

const result = decode('avc1.64002A');
console.dir(result);
const elt = document.createElement('div');
elt.innerHTML = result.toHTML();
document.body.append(elt);
```

### Typescript

See [index.d.ts](./index.d.ts) for Typescript types for this library.

```typescript
import { decode } from 'codec-string';

interface CodecDetails {
    label: string;
    error?: string;
    details: string[];
}

interface CodecInformation {
    codec: string;
    error?: string;
    details: CodecDetails[];
}

const codec = 'avc1.64002A';
const { error, decodes } = decode(codec);
const ci: CodecInformation = {
  codec,
  error,
  details: decodes.map(({parsed, error, label}) => ({
    label,
    error,
    details: parsed.map(p => p.decode),
  })),
};
```

### CommonJS module in Node.js

```javascript
const { decode } = require('cjs/codec-string.cjs');

console.dir(decode('avc1.64002A'));
```

To run the Node.js example after building this library:

```sh
(cd dist/cjs/ && node ./node_app.cjs )
```

### Legacy script tag in a browser

```html
<!doctype html>
<html>
<head>
<script src="script/codec-string.js"></script>
</head>
<body>
<script type="application/javascript">
const result = CodecString.decode('avc1.64002A');
console.dir(result);
const elt = document.createElement('div');
elt.innerHTML = result.toHTML();
document.body.append(elt);
</script>
</body>
</html>
```

### Testing

Unit tests:

```sh
npm run test
```

Browser based tests:

```sh
npm run start
```

In a browser go to the page http://localhost:8080/tests/index.html
this will list all of the available browser-based tests.

### License

This software is distributed under the terms of the Simplified BSD License.
See the file `LICENSE.txt` for details.

*Copyright (c) 2021-2024, Paul Higgs*<br/>
*All rights reserved*
