const { NFC } = require("nfc-pcsc");
const fs = require("fs");
const csv = require("csv-parser");
const crypto = require('crypto');
const signale = require('signale');

const csvFilePath = './A.csv';

function hashLRN(lrn) {
  return crypto.createHash('sha256').update(lrn).digest('hex');
}

async function writeToCard(reader, hashedLRN) {
  try {
    const lrnBuffer = Buffer.from(hashedLRN, 'utf8');
    await reader.write(0, lrnBuffer, 0); 
    await activateGreenLedAndBuzzer(reader);
    return true;
  } catch (err) {
    signale.error(`Error writing to NFC card: ${err}`);
    await activateRedLedAndStopBuzzer(reader); 
    return false;
  }
}

const nfc = new NFC();
nfc.on('reader', reader => {
  signale.info(`${reader.reader.name} device attached`);
  
  let lrnQueue = [];
  
  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on('data', (row) => {
      const lrn = row['LRN'].trim();
      lrnQueue.push(lrn);
    })
    .on('end', async () => {
      signale.info('CSV file processed. Ready to write LRNs.');
      processNextLRN(reader, lrnQueue);
    });

  reader.on("card", () => {
    signale.info("NFC card detected, ready to write.");
  });

  reader.on("end", () => {
    signale.info("Reader disconnected.");
  });

  reader.on("error", (err) => {
    signale.error(`Error: ${err}`);
  });
});

nfc.on("error", (err) => {
  signale.error(`NFC error: ${err}`);
});

async function processNextLRN(reader, lrnQueue) {
  if (lrnQueue.length === 0) {
    signale.info("All LRNs processed.");
    return;
  }

  const lrn = lrnQueue.shift();
  signale.info(`[info] Ready to write, LRN: ${lrn}`);

  const hashedLRN = hashLRN(lrn);
  const success = await writeToCard(reader, hashedLRN);

  if (success) {
    signale.success(`[suc] Successfully wrote LRN ${lrn}`);
  } else {
    signale.error(`[err] Error writing LRN ${lrn}`);
  }

  processNextLRN(reader, lrnQueue);
}

async function activateGreenLedAndBuzzer(reader) {
  try {
    const greenCommand = Buffer.from([0xff, 0x00, 0x40, 0x2e, 0x04, 0x01, 0x00, 0x01, 0x01]);
    await reader.transmit(greenCommand, 40);
  } catch (err) {
    signale.error(`Error activating green LED and buzzer: ${err}`);
  }
}

async function activateRedLedAndStopBuzzer(reader) {
  try {
    const redCommand = Buffer.from([0xff, 0x00, 0x40, 0x5d, 0x04, 0x02, 0x01, 0x05, 0x01]);
    await reader.transmit(redCommand, 40);
  } catch (err) {
    signale.error(`Error activating red LED and stopping buzzer: ${err}`);
  }
}
