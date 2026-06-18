const API_BASE = import.meta.env.VITE_API_BASE as string
const API_KEY = import.meta.env.VITE_API_KEY as string

// GET single student
export async function getStudent(record_id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/students?record_id=${record_id}`, {
    headers: { 'x-api-key': API_KEY }
  })
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
  return res.json()
}

// GET all students
export async function getAllStudents(): Promise<any> {
  const res = await fetch(`${API_BASE}/students`, { headers: { 'x-api-key': API_KEY } })
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
  return res.json()
}

// POST (create student)
export async function addStudent(student: any): Promise<any> {
  const res = await fetch(`${API_BASE}/students`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
    body: JSON.stringify(student),
  })
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
  return res.json()
}

// PUT (update student)
export async function updateStudent(record_id: string, student: any): Promise<any> {
  const res = await fetch(`${API_BASE}/students?record_id=${record_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
    body: JSON.stringify(student),
  })
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
  return res.json()
}

// DELETE student
export async function deleteStudent(record_id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/students?record_id=${record_id}`, {
    method: 'DELETE',
    headers: { 'x-api-key': API_KEY },
  })
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
  return res.json()
}
