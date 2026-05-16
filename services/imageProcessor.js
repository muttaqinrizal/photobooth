const sharp = require('sharp');
const path = require('path');
const fs = require('fs-extra');

class ImageProcessor {
  constructor() {
    this.rootDir = process.cwd();
    this.assetsDir = path.resolve(this.rootDir, './public/assets');
    this.ensureAssets();
  }

  async ensureAssets() {
    await fs.ensureDir(this.assetsDir);
  }

  async processPhoto(inputPath) {
    const fileName = path.basename(inputPath);
    const outputDir = path.resolve(this.rootDir, process.env.READY_PHOTOS_DIR || './photos/ready');
    await fs.ensureDir(outputDir);
    
    const outputPath = path.join(outputDir, fileName);

    try {
      // Basic processing (resize & normalize)
      await sharp(inputPath)
        .resize(1920, 1280, { fit: 'cover' })
        .jpeg({ quality: 90 })
        .toFile(outputPath);

      return outputPath;
    } catch (error) {
      console.error('Sharp Processing Error:', error);
      throw new Error(`Processing failed: ${error.message}`);
    }
  }

  async createLayout(photoPaths, layoutType) {
    const outputDir = path.resolve(this.rootDir, process.env.READY_PHOTOS_DIR || './photos/ready');
    const fileName = `final_${Date.now()}.jpg`;
    const outputPath = path.join(outputDir, fileName);

    try {
      if (layoutType === 'grid') {
        // 3 photos in a 1x3 horizontal grid or vertical?
        // Let's do a 3x1 vertical strip for "strip" and a grid for "grid"
        return await this.createGrid(photoPaths, outputPath);
      } else if (layoutType === 'strip') {
        return await this.createStrip(photoPaths, outputPath);
      } else {
        // Single - just return the first one (already processed)
        return photoPaths[0];
      }
    } catch (error) {
      console.error('Layout Creation Error:', error);
      throw error;
    }
  }

  async createGrid(photoPaths, outputPath) {
    // Create a 3x1 vertical grid (Classic Photobooth Strip style but wider)
    const width = 1200;
    const photoHeight = 800;
    const padding = 40;
    const totalHeight = (photoHeight * 3) + (padding * 4);

    const canvas = sharp({
      create: {
        width: width,
        height: totalHeight,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    });

    const composites = [];
    for (let i = 0; i < photoPaths.length; i++) {
      composites.push({
        input: await sharp(photoPaths[i]).resize(width - (padding * 2), photoHeight).toBuffer(),
        top: padding + (i * (photoHeight + padding)),
        left: padding
      });
    }

    await canvas.composite(composites).jpeg().toFile(outputPath);
    return outputPath;
  }

  async createStrip(photoPaths, outputPath) {
    // Classic thin strip
    const width = 600;
    const photoHeight = 400;
    const padding = 20;
    const totalHeight = (photoHeight * 3) + (padding * 6) + 100; // Extra space for branding

    const canvas = sharp({
      create: {
        width: width,
        height: totalHeight,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    });

    const composites = [];
    for (let i = 0; i < photoPaths.length; i++) {
      composites.push({
        input: await sharp(photoPaths[i]).resize(width - (padding * 2), photoHeight).toBuffer(),
        top: padding + (i * (photoHeight + padding)),
        left: padding
      });
    }

    // Add branding text at bottom
    composites.push({
      input: Buffer.from(
        `<svg width="${width}" height="100">
          <text x="50%" y="50%" font-family="Arial" font-size="24" fill="#333" text-anchor="middle">SONY ZV-E10 PHOTOBOOTH</text>
        </svg>`
      ),
      top: totalHeight - 100,
      left: 0
    });

    await canvas.composite(composites).jpeg().toFile(outputPath);
    return outputPath;
  }
}

module.exports = new ImageProcessor();
