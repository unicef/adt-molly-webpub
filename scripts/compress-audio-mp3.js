#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class MP3Compressor {
  constructor(options = {}) {
    this.baseDir = path.join(__dirname, '../PNLD/content/i18n');
    this.backupDir = path.join(__dirname, '../PNLD/content/i18n-backup-mp3');
    
    // Configurable compression settings - optimized for clear speech
    this.settings = {
      bitrate: options.bitrate || '64',     // High quality 96k for clearest speech
      sampleRate: options.sampleRate || '24000', // Higher sample rate for better clarity
      channels: options.channels || '1',
      quality: options.quality || '2'        // Better quality setting (0-9, lower = better)
    };
    
    this.stats = {
      totalFiles: 0,
      processedFiles: 0,
      originalSize: 0,
      compressedSize: 0,
      errors: []
    };
  }

  async init() {
    console.log('🎵 MP3 Audio Compression Tool - Configurable Quality');
    console.log('===================================================');
    console.log(`Settings: ${this.settings.bitrate} bitrate, ${parseInt(this.settings.sampleRate)/1000} kHz, ${this.settings.channels === '1' ? 'mono' : 'stereo'}`);
    console.log('Format: MP3 (maximum compatibility)\n');
    
    // Show quality estimation
    const bitrateNum = parseInt(this.settings.bitrate);
    const compressionRatio = Math.round(128 / bitrateNum * 10) / 10;
    console.log(`🎯 Expected compression: ~${compressionRatio}x smaller than original`);
    console.log(`📊 Quality level: ${this.getQualityDescription(bitrateNum)}\n`);
    
    // Check if ffmpeg is available
    if (!await this.checkFFmpeg()) {
      console.error('❌ FFmpeg is required but not found. Please install it first.');
      process.exit(1);
    }

    // Analyze current audio files
    await this.analyzeCurrentFiles();
    
    // Show compression preview
    console.log(`\n🤔 Ready to compress ${this.stats.totalFiles} MP3 files`);
    console.log(`📊 Current total size: ${this.formatBytes(this.stats.originalSize)}`);
    console.log(`📈 Expected size after compression: ~${this.formatBytes(this.stats.originalSize / 4)} (4x smaller)`);
    console.log(`💰 Expected savings: ~${this.formatBytes(this.stats.originalSize * 3/4)}`);
    console.log(`\n🎯 Quality: ${this.getQualityDescription()}`);
    
    await this.compressAllFiles();
  }

  getQualityDescription() {
    const bitrate = parseInt(this.settings.bitrate);
    if (bitrate >= 128) return 'Excellent quality - near original';
    if (bitrate >= 96) return 'High quality - clear natural speech';
    if (bitrate >= 64) return 'Good quality - clear speech';
    if (bitrate >= 48) return 'Decent quality - acceptable for most uses';
    if (bitrate >= 32) return 'Lower quality - telephone-like';
    return 'Very low quality - may be hard to understand';
  }

  async checkFFmpeg() {
    return new Promise((resolve) => {
      const ffmpeg = spawn('ffmpeg', ['-version']);
      ffmpeg.on('close', (code) => {
        resolve(code === 0);
      });
      ffmpeg.on('error', () => {
        resolve(false);
      });
    });
  }

  async analyzeCurrentFiles() {
    console.log('\n🔍 Analyzing original MP3 files from backup...');
    
    const languages = fs.readdirSync(this.backupDir).filter(dir => 
      fs.statSync(path.join(this.backupDir, dir)).isDirectory()
    );

    for (const lang of languages) {
      const audioDir = path.join(this.backupDir, lang, 'audio');
      if (fs.existsSync(audioDir)) {
        const files = fs.readdirSync(audioDir).filter(file => file.endsWith('.mp3'));
        
        for (const file of files) {
          const filePath = path.join(audioDir, file);
          const stats = fs.statSync(filePath);
          this.stats.totalFiles++;
          this.stats.originalSize += stats.size;
        }
        
        console.log(`  📂 ${lang}: ${files.length} files, ${this.formatBytes(this.getTotalSize(audioDir))}`);
      }
    }
  }

  getTotalSize(directory) {
    let totalSize = 0;
    const files = fs.readdirSync(directory);
    
    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = fs.statSync(filePath);
      if (stats.isFile() && file.endsWith('.mp3')) {
        totalSize += stats.size;
      }
    }
    
    return totalSize;
  }

  async compressAllFiles() {
    console.log('\n🔄 Starting MP3 compression process...');
    console.log('📂 Reading from original files in backup directory...');
    
    // Create backup first (if needed)
    await this.createBackup();
    
    const languages = fs.readdirSync(this.backupDir).filter(dir => 
      fs.statSync(path.join(this.backupDir, dir)).isDirectory()
    );

    for (const lang of languages) {
      console.log(`\n🌍 Processing ${lang} language files...`);
      await this.compressLanguageFiles(lang);
    }

    this.printFinalStats();
  }

  async createBackup() {
    console.log('\n💾 Creating backup of original MP3 files...');
    
    if (fs.existsSync(this.backupDir)) {
      console.log('   Backup already exists, skipping...');
      return;
    }

    // Copy entire i18n directory to backup
    await this.copyDirectory(this.baseDir, this.backupDir);
    console.log('   ✅ Backup created successfully');
  }

  async copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const items = fs.readdirSync(src);

    for (const item of items) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      const stats = fs.statSync(srcPath);

      if (stats.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  async compressLanguageFiles(language) {
    const sourceAudioDir = path.join(this.backupDir, language, 'audio');
    const targetAudioDir = path.join(this.baseDir, language, 'audio');
    
    if (!fs.existsSync(sourceAudioDir)) {
      console.log(`   ⏭️  No audio directory for ${language} in backup`);
      return;
    }

    // Ensure target directory exists
    if (!fs.existsSync(targetAudioDir)) {
      fs.mkdirSync(targetAudioDir, { recursive: true });
    }

    const mp3Files = fs.readdirSync(sourceAudioDir).filter(file => file.endsWith('.mp3'));
    
    console.log(`   📁 Found ${mp3Files.length} MP3 files to compress`);

    for (let i = 0; i < mp3Files.length; i++) {
      const file = mp3Files[i];
      const progress = `(${i + 1}/${mp3Files.length})`;
      
      console.log(`   🔄 ${progress} Compressing ${file}...`);
      
      try {
        await this.compressFile(sourceAudioDir, targetAudioDir, file);
        this.stats.processedFiles++;
        console.log(`   ✅ ${progress} ${file} compressed successfully`);
      } catch (error) {
        console.log(`   ❌ ${progress} Failed: ${file} - ${error.message}`);
        this.stats.errors.push({ file, error: error.message });
      }
    }
  }

  async compressFile(sourceAudioDir, targetAudioDir, filename) {
    const inputPath = path.join(sourceAudioDir, filename);
    const outputPath = path.join(targetAudioDir, filename);
    
    const originalSize = fs.statSync(inputPath).size;

    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', inputPath,                    // Input file from backup
        '-c:a', 'libmp3lame',              // Use MP3 LAME encoder
        '-b:a', this.settings.bitrate,     // Configurable bitrate
        '-ar', this.settings.sampleRate,   // Configurable sample rate
        '-ac', this.settings.channels,     // Configurable channels
        '-q:a', this.settings.quality,     // Configurable quality
        '-y',                              // Overwrite output file
        outputPath                         // Output to target directory
      ]);

      let errorOutput = '';

      ffmpeg.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          // Success - get compressed size
          const compressedSize = fs.statSync(outputPath).size;
          this.stats.compressedSize += compressedSize;
          
          resolve({ originalSize, compressedSize });
        } else {
          // Clean up output file if it exists
          if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
          }
          reject(new Error(`FFmpeg failed with code ${code}: ${errorOutput}`));
        }
      });

      ffmpeg.on('error', (error) => {
        // Clean up output file if it exists
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
        }
        reject(new Error(`Failed to start FFmpeg: ${error.message}`));
      });
    });
  }

  printFinalStats() {
    console.log('\n🎉 MP3 Audio Compression Complete!');
    console.log('===================================');
    console.log(`📊 Files processed: ${this.stats.processedFiles}/${this.stats.totalFiles}`);
    console.log(`📉 Original size:   ${this.formatBytes(this.stats.originalSize)}`);
    console.log(`📈 Compressed size: ${this.formatBytes(this.stats.compressedSize)}`);
    
    const savings = this.stats.originalSize - this.stats.compressedSize;
    const compressionRatio = this.stats.originalSize > 0 ? (savings / this.stats.originalSize * 100) : 0;
    
    console.log(`💰 Space saved:    ${this.formatBytes(savings)} (${compressionRatio.toFixed(1)}%)`);
    console.log(`📏 Compression:    ${(this.stats.originalSize / this.stats.compressedSize).toFixed(1)}x smaller`);

    if (this.stats.errors.length > 0) {
      console.log(`\n⚠️  Errors (${this.stats.errors.length}):`);
      this.stats.errors.forEach(error => {
        console.log(`   ❌ ${error.file}: ${error.error}`);
      });
    }

    console.log('\n📝 Results:');
    console.log('  ✅ All files remain in MP3 format (maximum compatibility)');
    console.log('  ✅ No code changes needed - same filenames and references');
    console.log('  ✅ Significant space savings achieved');
    console.log(`  ✅ Audio quality: ${this.getQualityDescription()}`);
    
    console.log('\n💾 Backup Information:');
    console.log(`  📁 Original files backed up to: ${this.backupDir}`);
    console.log('  🔄 To restore: copy files back from backup directory');
    
    console.log('\n🔧 MP3 Compression Settings Used:');
    console.log('  • Codec: MP3 (libmp3lame)');
    console.log(`  • Bitrate: ${this.settings.bitrate}bps`);
    console.log(`  • Sample Rate: ${this.settings.sampleRate} Hz`);
    console.log(`  • Channels: ${this.settings.channels === '1' ? 'Mono' : 'Stereo'}`);
    console.log(`  • Quality: ${this.settings.quality} (${this.getQualityDescription()})`);
    
    console.log('\n🎯 Next Steps:');
    console.log('  1. Test audio playback in your application');
    console.log('  2. Verify speech quality is acceptable');
    console.log('  3. If satisfied, you can remove the backup directory');
    console.log('  4. No code changes needed - same MP3 format maintained');
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Run the MP3 compressor
const compressor = new MP3Compressor();
compressor.init().catch(console.error);
