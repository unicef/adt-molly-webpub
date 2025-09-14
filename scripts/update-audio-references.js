#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class AudioFileUpdater {
  constructor() {
    this.baseDir = path.join(__dirname, '../PNLD/content/i18n');
    this.stats = {
      jsonFilesUpdated: 0,
      audioReferencesUpdated: 0
    };
  }

  async updateAudioReferences() {
    console.log('🔄 Updating Audio File References');
    console.log('=================================');
    console.log('Converting .mp3 references to .ogg in JSON files...\n');

    const languages = fs.readdirSync(this.baseDir).filter(dir => 
      fs.statSync(path.join(this.baseDir, dir)).isDirectory()
    );

    for (const lang of languages) {
      console.log(`🌍 Processing ${lang} language files...`);
      await this.updateLanguageReferences(lang);
    }

    console.log('\n✅ Audio Reference Update Complete!');
    console.log(`📊 JSON files updated: ${this.stats.jsonFilesUpdated}`);
    console.log(`🔗 Audio references updated: ${this.stats.audioReferencesUpdated}`);
  }

  async updateLanguageReferences(language) {
    const langDir = path.join(this.baseDir, language);
    
    // Find all JSON files in the language directory
    const jsonFiles = this.findJsonFiles(langDir);
    
    for (const jsonFile of jsonFiles) {
      const updated = await this.updateJsonFile(jsonFile);
      if (updated) {
        console.log(`   ✅ Updated: ${path.relative(this.baseDir, jsonFile)}`);
        this.stats.jsonFilesUpdated++;
      }
    }
  }

  findJsonFiles(directory) {
    const jsonFiles = [];
    
    function traverse(currentDir) {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const itemPath = path.join(currentDir, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          traverse(itemPath);
        } else if (item.endsWith('.json')) {
          jsonFiles.push(itemPath);
        }
      }
    }
    
    traverse(directory);
    return jsonFiles;
  }

  async updateJsonFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      
      let hasChanges = false;
      const updatedData = this.updateObjectReferences(data, hasChanges);
      
      if (updatedData.hasChanges) {
        // Write the updated JSON back to file
        fs.writeFileSync(filePath, JSON.stringify(updatedData.data, null, 2));
        this.stats.audioReferencesUpdated += updatedData.changeCount;
        return true;
      }
      
      return false;
    } catch (error) {
      console.warn(`   ⚠️  Warning: Could not process ${filePath}: ${error.message}`);
      return false;
    }
  }

  updateObjectReferences(obj, parentHasChanges = { hasChanges: false, changeCount: 0 }) {
    const result = { data: {}, hasChanges: false, changeCount: 0 };
    
    if (Array.isArray(obj)) {
      result.data = obj.map(item => {
        if (typeof item === 'string' && item.endsWith('.mp3')) {
          result.hasChanges = true;
          result.changeCount++;
          return item.replace('.mp3', '.ogg');
        } else if (typeof item === 'object' && item !== null) {
          const nested = this.updateObjectReferences(item);
          if (nested.hasChanges) {
            result.hasChanges = true;
            result.changeCount += nested.changeCount;
          }
          return nested.data;
        }
        return item;
      });
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string' && value.endsWith('.mp3')) {
          result.data[key] = value.replace('.mp3', '.ogg');
          result.hasChanges = true;
          result.changeCount++;
        } else if (typeof value === 'object' && value !== null) {
          const nested = this.updateObjectReferences(value);
          result.data[key] = nested.data;
          if (nested.hasChanges) {
            result.hasChanges = true;
            result.changeCount += nested.changeCount;
          }
        } else {
          result.data[key] = value;
        }
      }
    } else {
      result.data = obj;
    }
    
    return result;
  }
}

// Run the updater
const updater = new AudioFileUpdater();
updater.updateAudioReferences().catch(console.error);
