// src/utils/dateUtils.js

// Function untuk dapatkan waktu Malaysia (UTC+8)
export function getMalaysiaTime(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  // Malaysia is UTC+8
  const malaysiaTime = new Date(date.getTime() + (8 * 60 * 60 * 1000))
  return malaysiaTime.toLocaleTimeString('ms-MY', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

export function getMalaysiaDateTime(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  const malaysiaTime = new Date(date.getTime() + (8 * 60 * 60 * 1000))
  return malaysiaTime.toLocaleString('ms-MY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function getMalaysiaDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  const malaysiaTime = new Date(date.getTime() + (8 * 60 * 60 * 1000))
  return malaysiaTime.toLocaleDateString('ms-MY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

// Untuk waiting time calculation (KitchenApp)
export function getWaitingTime(createdAt) {
  if (!createdAt) return '-'
  const created = new Date(createdAt)
  const now = new Date()
  // Add 8 hours for Malaysia timezone difference in calculation
  const createdMalaysia = new Date(created.getTime() + (8 * 60 * 60 * 1000))
  const nowMalaysia = new Date(now.getTime() + (8 * 60 * 60 * 1000))
  const diffMinutes = Math.floor((nowMalaysia - createdMalaysia) / 60000)
  
  if (diffMinutes < 1) return 'Baru sahaja'
  if (diffMinutes < 60) return `${diffMinutes} minit`
  const hours = Math.floor(diffMinutes / 60)
  const minutes = diffMinutes % 60
  if (minutes === 0) return `${hours} jam`
  return `${hours} jam ${minutes} minit`
}