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

### ESM module

```javascript
import { decode } from 'esm/codec-string.js';

console.log(decode('avc1.64002A'));
```

### CommonJS module

```javascript
const { decode } = require('cjs/codec-string.cjs');

console.log(decode('avc1.64002A'));
```

### Legacy

```html
<!doctype html>
<html>
<head>
<script src="script/codec-string.js"></script>
</head>
<body>
<script type="application/javascript">
console.log(window.CodecString.decode('avc1.64002A'));
</script>
</body>
</html>
```

### License

This software is distributed under the terms of the Simplified BSD License.
See the file `LICENSE.txt` for details.

*Copyright (c) 2021-2024, Paul Higgs*<br/>
*All rights reserved*
