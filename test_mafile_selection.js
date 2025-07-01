// Тестовий скрипт для перевірки функції selectMaFile
// Можна використовувати в DevTools браузера

console.log('=== Тест selectMaFile функції ===');

// Функція для створення фейкового File об'єкта
function createMockFile(name, content) {
  const blob = new Blob([content], { type: 'application/octet-stream' });
  const file = new File([blob], name, { type: 'application/octet-stream' });
  return file;
}

// Функція для створення фейкового event об'єкта
function createMockEvent(file) {
  return {
    target: {
      files: [file]
    }
  };
}

// Тест 1: Перевірка властивостей файлу
console.log('\n--- Тест 1: Властивості файлу ---');
const testFile = createMockFile('test.maFile', 'test content');
console.log('File properties:');
console.log('- name:', testFile.name);
console.log('- size:', testFile.size);
console.log('- type:', testFile.type);
console.log('- path:', testFile.path); // може бути undefined
console.log('- webkitRelativePath:', testFile.webkitRelativePath);

// Тест 2: FileReader
console.log('\n--- Тест 2: FileReader ---');
const reader = new FileReader();
reader.onload = function(e) {
  console.log('FileReader успішно прочитав файл');
  console.log('Result type:', typeof e.target.result);
  console.log('Result size:', e.target.result.byteLength);
  
  // Перевірка Buffer.from
  try {
    const buffer = Buffer.from(e.target.result);
    console.log('Buffer створений успішно, size:', buffer.length);
  } catch (error) {
    console.error('Помилка створення Buffer:', error);
  }
};

reader.onerror = function(error) {
  console.error('Помилка FileReader:', error);
};

reader.readAsArrayBuffer(testFile);

// Тест 3: Доступність модулів
console.log('\n--- Тест 3: Доступність модулів ---');
console.log('fs available:', typeof fs !== 'undefined');
console.log('path available:', typeof path !== 'undefined');
console.log('ipcRenderer available:', typeof ipcRenderer !== 'undefined');

console.log('\n=== Кінець тестів ===');
