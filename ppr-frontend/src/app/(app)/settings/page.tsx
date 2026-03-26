'use client'

import { Button } from '@/components/button'
import { Divider } from '@/components/divider'
import { Heading, Subheading } from '@/components/heading'
import { Input } from '@/components/input'
import { Text } from '@/components/text'
import { useAuth } from '@/hooks/use-auth'
import { useUserService } from '@/lib/user-service'
import { useEffect, useState } from 'react'
import { User } from '@/types/api'

export default function Settings() {
  const { userInfo } = useAuth()
  const { fetchUserById, updateUser, syncUser } = useUserService()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    user_email: ''
  })

  useEffect(() => {
    async function loadUser() {
      if (userInfo?.sub) {
        try {
          // 1. Sync to get internal ID
          const partialUser = await syncUser()
          const userId = (partialUser as any).id_user || partialUser.id

          if (userId) {
            // 2. Fetch full entity with all required fields
            const fullUserData = await fetchUserById(userId)
            setUser(fullUserData)
            setFormData({
              name: (fullUserData as any).name || '',
              surname: (fullUserData as any).surname || '',
              user_email: (fullUserData as any).user_email || (fullUserData as any).mail || ''
            })
          }
        } catch (error) {
          console.error('Failed to load user:', error)
          setMessage({ type: 'error', text: 'Failed to load user details.' })
        } finally {
          setLoading(false)
        }
      }
    }
    loadUser()
  }, [userInfo?.sub])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)


    setSaving(true)
    try {
      const userId = user?.id || (user as any)?.id_user

      if (userId && user) {
        // Merge full user object with updated form data and provide defaults for required fields
        const updatePayload = {
          id_organization: (user as any).id_organization || 'org_001',
          address_street: (user as any).address_street || 'A',
          address_number: (user as any).address_number || '0',
          address_state: (user as any).address_state || 'A',
          address_country: (user as any).address_country || 'A',
          phone_mobile: (user as any).phone_mobile || '0',
          active: (user as any).active ?? true,
          birthday: (user as any).birthday || '1980-01-01',
          role: (user as any).role || 'user',
          ...user,
          ...formData
        }
        console.log('Updating user with merged payload:', userId, updatePayload)

        await updateUser(userId, updatePayload)
        setMessage({ type: 'success', text: 'Settings updated successfully.' })
      } else {
        console.error('No user ID found for update', user)
        setMessage({ type: 'error', text: 'Internal error: User ID not found.' })
      }
    } catch (error) {
      console.error('Failed to update user:', error)
      setMessage({ type: 'error', text: 'Failed to save changes. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl py-10">
        <Text>Loading settings...</Text>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-4xl">
      <Heading>Settings</Heading>
      <Divider className="my-10 mt-6" />

      {message && (
        <div className={`mb-6 p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        <div className="space-y-1">
          <Subheading>First Name</Subheading>
          <Text>Your given name.</Text>
        </div>
        <div>
          <Input
            aria-label="First Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your first name"
          />
        </div>
      </section>

      <Divider className="my-10" soft />

      <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        <div className="space-y-1">
          <Subheading>Last Name</Subheading>
          <Text>Your family name.</Text>
        </div>
        <div>
          <Input
            aria-label="Last Name"
            name="surname"
            value={formData.surname}
            onChange={handleChange}
            placeholder="Enter your last name"
          />
        </div>
      </section>

      <Divider className="my-10" soft />

      <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        <div className="space-y-1">
          <Subheading>Email</Subheading>
          <Text>Your contact email address.</Text>
        </div>
        <div>
          <Input
            type="email"
            aria-label="Email"
            name="user_email"
            value={formData.user_email}
            disabled
            placeholder="Enter your email"
          />
        </div>
      </section>


      <Divider className="my-10" soft />

      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}
