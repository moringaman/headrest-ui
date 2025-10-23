import CryptoJS from 'crypto-js'

const ENCRYPTION_KEY = '0eb1670a683413706c95b701827e149da23951777c0313b9cc11faf520fa99ed'

// Helper function to convert hex string to bytes
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16)
  }
  return bytes
}

// Helper function to convert bytes to hex string
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

export function decryptData(encryptedData: string | undefined | null): string {
  // Return empty string if data is null, undefined, or empty
  if (!encryptedData || encryptedData.trim() === '') {
    return ''
  }
  
  console.log('Attempting to decrypt AES-256-GCM:', encryptedData)
  
  try {
    // Check if the data is in the format "hash:salt:encrypted_data"
    const parts = encryptedData.split(':')
    if (parts.length === 3) {
      console.log('Detected AES-256-GCM format with parts:', parts)
      
      const hash = parts[0]
      const salt = parts[1] 
      const encryptedPart = parts[2]
      
      // For now, let's try different key derivation methods with standard AES
      // Since CryptoJS doesn't support GCM natively, we'll try various approaches
      const keysToTry = [
        // Use the main encryption key directly
        ENCRYPTION_KEY,
        // Derive key from salt using PBKDF2
        CryptoJS.PBKDF2(ENCRYPTION_KEY, salt, { keySize: 256/32, iterations: 10000 }).toString(),
        // Derive key from salt using SHA256
        CryptoJS.SHA256(ENCRYPTION_KEY + salt).toString(),
        // Use salt as key directly
        salt,
        // Use hash as key directly  
        hash,
        // Combine salt with main key
        CryptoJS.SHA256(salt + ENCRYPTION_KEY).toString(),
        // Combine hash with main key
        CryptoJS.SHA256(hash + ENCRYPTION_KEY).toString(),
        // Try different key lengths
        salt.substring(0, 32),
        hash.substring(0, 32),
        // Try MD5 hashes
        CryptoJS.MD5(salt).toString(),
        CryptoJS.MD5(hash).toString(),
        CryptoJS.MD5(salt + ENCRYPTION_KEY).toString(),
        CryptoJS.MD5(hash + ENCRYPTION_KEY).toString(),
      ]
      
      for (let i = 0; i < keysToTry.length; i++) {
        try {
          const key = keysToTry[i]
          console.log(`Trying AES key ${i + 1}:`, key.substring(0, 20) + '...')
          
          // Try standard AES decryption
          const bytes = CryptoJS.AES.decrypt(encryptedPart, key)
          const decrypted = bytes.toString(CryptoJS.enc.Utf8)
          
          if (decrypted && decrypted !== '' && decrypted.length > 0) {
            console.log(`AES key ${i + 1} succeeded:`, decrypted)
            return decrypted
          }
        } catch (e) {
          console.log(`AES key ${i + 1} failed:`, e.message)
        }
      }
      
      console.log('All AES key derivation methods failed')
      return encryptedData
    } else {
      // Try standard AES decryption for non-GCM format
      const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY)
      const decrypted = bytes.toString(CryptoJS.enc.Utf8)
      
      if (decrypted && decrypted !== '') {
        console.log('Standard AES decryption succeeded:', decrypted)
        return decrypted
      }
      
      console.log('Standard decryption resulted in empty string')
      return encryptedData
    }
  } catch (error) {
    console.error('All AES decryption methods failed:', error)
    return encryptedData
  }
}

export function encryptData(data: string): string {
  try {
    return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString()
  } catch (error) {
    console.error('Encryption failed:', error)
    return data // Return original if encryption fails
  }
}
