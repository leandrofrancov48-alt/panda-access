import QRCode from "qrcode";

export async function generateQrDataUrl(data: string): Promise<string> {
  try {
    return await QRCode.toDataURL(data, {
      errorCorrectionLevel: "M",
      margin: 3,
      width: 450,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
  } catch (error) {
    console.error("Error generating QR data URL:", error);
    throw error;
  }
}

export async function generateQrSvg(data: string): Promise<string> {
  try {
    return await QRCode.toString(data, {
      type: "svg",
      errorCorrectionLevel: "H",
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
  } catch (error) {
    console.error("Error generating QR SVG:", error);
    throw error;
  }
}
