import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { AiAssistantChat } from './AiAssistantChat'

export function FloatingAiChat() {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-elevation bg-[#094016] hover:bg-[#094016]/90 text-white z-50 transition-all hover:scale-105"
          size="icon"
        >
          {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[350px] md:w-[400px] p-0 mr-6 mb-2 border-[#094016]/20 shadow-elevation"
        align="end"
        side="top"
      >
        <div className="bg-white rounded-md overflow-hidden">
          <AiAssistantChat contextData={{}} onAcceptSuggestion={() => {}} />
        </div>
      </PopoverContent>
    </Popover>
  )
}
