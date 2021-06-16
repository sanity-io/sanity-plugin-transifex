import React from 'react'
import { Dialog, Box, Text } from '@sanity/ui'

type SettingsViewProps = {
  onClose: () => void
}

export const SettingsView = ({ onClose }: SettingsViewProps) => {
  return (
    <Dialog header="Example" id="dialog-example" onClose={onClose}>
      <Box padding={4}>
        <Text>Content</Text>
      </Box>
    </Dialog>
  )
}
