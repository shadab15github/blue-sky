export interface User {
  id: number
  name: string
  username: string
  email: string
  phone: string
  website: string
  company: {
    name: string
    catchPhrase: string
  }
  address: {
    city: string
    zipcode: string
  }
}

export interface Settings {
  sort: {
    field: 'name' | 'city' | 'joined'
    direction: 'asc' | 'desc'
  }
  view: {
    dateFormat: string
    showRelative: boolean
  }
}
