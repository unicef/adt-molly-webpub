#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class AudioCompressor {
  constructor() {
    this.baseDir = path.join(__dirname, '../PNLD/content/i18n');
    this.backupDir = path.join(__dirname, '../PNLD/content/i18n-backup');
    this.stats = {
      totalFiles: 0,
      processedFiles: 0,
      originalSize: 0,
      compressedSize: 0,
      errors: []
    };
  }

  async init() {
    console.log('🎵 Audio Compression Tool - MP3 to Opus/OGG');
    console.log('=============================================');
    
    // Check if ffmpeg is available
    if (!await this.checkFFmpeg()) {
      console.error('❌ FFmpeg is required but not found. Please install it first.');
      process.exit(1);
    }

    // Analyze current audio files
    await this.analyzeCurrentFiles();
    
    // Ask for confirmation
    console.log(`\n🤔 Ready to compress ${this.stats.totalFiles} audio files`);
    console.log(`📊 Current total size: ${this.formatBytes(this.stats.originalSize)}`);
    console.log(`📈 Expected size after compression: ~${this.formatBytes(this.stats.originalSize / 8)} (8x smaller)`);
    console.log(`💰 Expected savings: ~${this.formatBytes(this.stats.originalSize * 7/8)}`);
    
    // For now, let's proceed (in a real CLI tool you'd prompt for confirmation)
    await this.compressAllFiles();
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
    console.log('\n🔍 Analyzing current audio files...');
    
    const languages = fs.readdirSync(this.baseDir).filter(dir => 
      fs.statSync(path.join(this.baseDir, dir)).isDirectory()
    );

    for (const lang of languages) {
      const audioDir = path.join(this.baseDir, lang, 'audio');
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
    console.log('\n🔄 Starting compression process...');
    
    // Create backup first
    await this.createBackup();
    
    const languages = fs.readdirSync(this.baseDir).filter(dir => 
      fs.statSync(path.join(this.baseDir, dir)).isDirectory()
    );

    for (const lang of languages) {
      console.log(`\n🌍 Processing ${lang} language files...`);
      await this.compressLanguageFiles(lang);
    }

    this.printFinalStats();
  }

  async createBackup() {
    console.log('\n💾 Creating backup of original files...');
    
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
    const audioDir = path.join(this.baseDir, language, 'audio');
    
    if (!fs.existsSync(audioDir)) {
      console.log(`   ⏭️  No audio directory for ${language}`);
      return;
    }

    const mp3Files = fs.readdirSync(audioDir).filter(file => file.endsWith('.mp3'));
    
    console.log(`   📁 Found ${mp3Files.length} MP3 files to compress`);

    for (let i = 0; i < mp3Files.length; i++) {
      const file = mp3Files[i];
      const progress = `(${i + 1}/${mp3Files.length})`;
      
      console.log(`   🔄 ${progress} Compressing ${file}...`);
      
      try {
        await this.compressFile(audioDir, file);
        this.stats.processedFiles++;
        console.log(`   ✅ ${progress} ${file} → ${file.replace('.mp3', '.ogg')}`);
      } catch (error) {
        console.log(`   ❌ ${progress} Failed: ${file} - ${error.message}`);
        this.stats.errors.push({ file, error: error.message });
      }
    }
  }

  async compressFile(audioDir, filename) {
    const inputPath = path.join(audioDir, filename);
    const outputPath = path.join(audioDir, filename.replace('.mp3', '.ogg'));
    
    const originalSize = fs.statSync(inputPath).size;

    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', inputPath,           // Input file
        '-c:a', 'libopus',         // Use Opus codec
        '-b:a', '16k',             // 16 kbps bitrate
        '-ar', '16000',            // 16 kHz sample rate
        '-ac', '1',                // Mono
        '-application', 'voip',    // Optimize for speech
        '-y',                      // Overwrite output file
        outputPath
      ]);

      let errorOutput = '';

      ffmpeg.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          // Success - get compressed size and remove original
          const compressedSize = fs.statSync(outputPath).size;
          this.stats.compressedSize += compressedSize;
          
          // Remove original MP3 file
          fs.unlinkSync(inputPath);
          
          resolve({ originalSize, compressedSize });
        } else {
          reject(new Error(`FFmpeg failed with code ${code}: ${errorOutput}`));
        }
      });

      ffmpeg.on('error', (error) => {
        reject(new Error(`Failed to start FFmpeg: ${error.message}`));
      });
    });
  }

  printFinalStats() {
    console.log('\n🎉 Audio Compression Complete!');
    console.log('===============================');
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

    console.log('\n📝 Next Steps:');
    console.log('  1. Update your audio loading code to use .ogg files instead of .mp3');
    console.log('  2. Test audio playback in your application');
    console.log('  3. If everything works, you can remove the backup directory');
    console.log(`  4. Backup location: ${this.backupDir}`);
    
    console.log('\n🔧 Opus/OGG Settings Used:');
    console.log('  • Codec: Opus (libopus)');
    console.log('  • Bitrate: 16 kbps');
    console.log('  • Sample Rate: 16 kHz');
    console.log('  • Channels: Mono');
    console.log('  • Application: VoIP (optimized for speech)');
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Run the compressor
const compressor = new AudioCompressor();
compressor.init().catch(console.error);
