# codec-string
decode the codec= string in a media mime type

supports 
* HEVC (hvc1, hev1) 
* AVC (avc1)
* AAC (mp4a)
* AV1 (av01)
* E-AC3 (ec-3) - no processing required
* VP9 - see https://www.webmproject.org/vp9/mp4/
* EVC - refer annex E.9 of ISO/IEC 14496-15:2019 Amd.2 
* VVC - refer annex E.6 of ISO/IEC 14496-15:2019 Amd.2
* MPEG-H
* AVS3

### Installation
Install [nodejs](https://nodejs.org/en)
Install required packages:

```sh
npm ci
```

Create the `codec-string.min.js` bundle:

```sh
npm run build
```

This will produce a `dist` directory with the `codec-string.min.js`
library and an example application (`app.min.js` and `index.html`).

### Usage

```javascript
import { decode } from 'codec-string';

console.log(decode('avc1.64002A'));
```

### License

This software is distributed under the terms of the Simplified BSD License.
See the file `LICENSE.txt` for details.

*Copyright (c) 2021-2023, Paul Higgs*<br/>
*All rights reserved*
