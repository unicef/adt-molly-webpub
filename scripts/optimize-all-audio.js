#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

class AudioOptimizer {
  async run() {
    console.log('🎵 Complete Audio Optimization Pipeline');
    console.log('======================================');
    console.log('This will:');
    console.log('1. 💾 Backup original MP3 files');
    console.log('2. 🗜️  Compress MP3 → Opus/OGG (8x smaller)');
    console.log('3. 🔄 Update JSON references (.mp3 → .ogg)');
    console.log('4. 📊 Generate final report\n');

    try {
      // Step 1: Run compression
      console.log('Step 1: Running audio compression...');
      await this.runScript('compress-audio.js');
      
      // Step 2: Update references
      console.log('\nStep 2: Updating audio file references...');
      await this.runScript('update-audio-references.js');
      
      console.log('\n🎉 Complete Audio Optimization Finished!');
      console.log('\n📝 What happened:');
      console.log('✅ All MP3 files converted to Opus/OGG format');
      console.log('✅ JSON files updated to reference .ogg files');
      console.log('✅ Original files backed up to i18n-backup/');
      console.log('✅ Expected ~8x file size reduction achieved');
      
      console.log('\n🔧 Next Steps:');
      console.log('1. Test audio playback in your application');
      console.log('2. Verify all audio features work correctly');
      console.log('3. If satisfied, remove the backup directory');
      console.log('4. Commit the optimized files to your repository');
      
    } catch (error) {
      console.error('\n❌ Optimization failed:', error.message);
      console.log('\n🔄 To recover:');
      console.log('1. Restore from backup if needed');
      console.log('2. Check the error message above');
      console.log('3. Fix any issues and try again');
    }
  }

  runScript(scriptName) {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(__dirname, scriptName);
      const child = spawn('node', [scriptPath], {
        stdio: 'inherit',
        cwd: __dirname
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Script ${scriptName} failed with exit code ${code}`));
        }
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to run ${scriptName}: ${error.message}`));
      });
    });
  }
}

// Run the complete optimization
const optimizer = new AudioOptimizer();
optimizer.run().catch(console.error);
