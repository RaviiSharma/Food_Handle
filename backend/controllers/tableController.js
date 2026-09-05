import QRCode from "qrcode";

export async function getTableQRCodes(req, res) {
  try {
    // ==========================================
    // FRONTEND URL
    // ==========================================

    const frontend =
      process.env.CLIENT_URL ||
      "http://localhost:5173";

    if (
      typeof frontend !== "string" ||
      !frontend.trim()
    ) {
      return res.status(500).json({
        success: false,
        message:
          "Client URL is not configured on the server.",
      });
    }


    // ==========================================
    // COUNT VALIDATION
    // ==========================================

    const rawCount = req.query.count;

    if (
      rawCount === undefined ||
      rawCount === null ||
      rawCount === ""
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Number of tables is required.",
      });
    }


    // Make sure only a proper integer is accepted

    const count = Number(rawCount);

    if (!Number.isFinite(count)) {
      return res.status(400).json({
        success: false,
        message:
          "Number of tables must be a valid number.",
      });
    }


    if (!Number.isInteger(count)) {
      return res.status(400).json({
        success: false,
        message:
          "Number of tables must be a whole number.",
      });
    }


    if (count < 1) {
      return res.status(400).json({
        success: false,
        message:
          "Number of tables must be at least 1.",
      });
    }


    // Maximum protection against
    // accidentally generating thousands of QR codes

    if (count > 500) {
      return res.status(400).json({
        success: false,
        message:
          "You can generate a maximum of 500 table QR codes at once.",
      });
    }


    // ==========================================
    // CLEAN FRONTEND URL
    // ==========================================

    const baseUrl =
      frontend.trim().replace(/\/+$/, "");


    // ==========================================
    // GENERATE QR CODES
    // ==========================================

    const tables = [];

    for (let tableNumber = 1; tableNumber <= count; tableNumber++) {

      const url =
        `${baseUrl}/menu?table=${tableNumber}`;

      const dataUrl =
        await QRCode.toDataURL(
          url,
          {
            width: 500,
            margin: 2,
            errorCorrectionLevel: "M",
          }
        );

      tables.push({
        tableNumber,
        url,
        dataUrl,
      });
    }


    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      count: tables.length,
      data: tables,
    });

  } catch (error) {

    console.error(
      "Table QR generation error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to generate table QR codes. Please try again.",
    });
  }
}