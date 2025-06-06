export interface CodecParserResult {
    decode: string;
}

export interface DecodedCodec {
    parsed: CodecParserResult[] | null;
    error?: string;
    label: string;
}

export interface CodecDecodeResults {
    decodes: DecodedCodec[];
    error?: string;
    toHTML: () => string;
}

export function decode(val: string): CodecDecodeResults;
