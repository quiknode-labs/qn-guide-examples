import { IFrameProps } from "../types";

export function generateFarcasterFrameMetaTag({ frame, imageUrl, postUrl, buttons, aspectRatio, action, target }: IFrameProps): string {
    let metaTag = `<meta property="fc:frame" content="${frame || "vNext"}" />\n`;
    metaTag += `<meta property="og:image:image:aspect_ratio" content="${aspectRatio || "1.91:1"}" />\n`;
    metaTag += `<meta property="og:image" content="${imageUrl}" />\n`;
    metaTag += `<meta property="fc:frame:image:aspect_ratio" content="${aspectRatio || "1.91:1"}" />\n`;
    metaTag += `<meta property="fc:frame:image" content="${imageUrl}" />\n`;

    if (postUrl) {
        metaTag += `<meta property="fc:frame:post_url" content="${postUrl}" />\n`;
    }

    if (buttons) {
        buttons.forEach((button, index) => {
            metaTag += `<meta property="fc:frame:button:${index + 1}" content="${button}" />\n`;
            if (action && target && index === 1) {
                metaTag += `<meta property="fc:frame:button:${index + 1}:action" content="${action}" />\n`;
                metaTag += `<meta property="fc:frame:button:${index + 1}:target" content="${target}" />\n`;
            }
        });
    }

    return metaTag;
}

export function frameGenerator(frameProps: IFrameProps): string {
    const metaTag = generateFarcasterFrameMetaTag(frameProps);

    return `<!DOCTYPE html>
    <html lang="en">
        <head>
            <title>${frameProps.frame}</title>
            ${metaTag}
        </head>
    </html>`;
}