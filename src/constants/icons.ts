import {
    Briefcase, Heart, User, Home, DollarSign, Book, Plane, Star, Zap,
    Coffee, Music, Gamepad, Bookmark, Tag,
    Crown, Smile, UserCircle, Ghost, Cat, Dog, Bird, Component,
    ShoppingBag, Dumbbell, Clapperboard, Gift, Globe, Camera, Wrench,
    User, Rocket, Trophy, Fish, Bug, Rabbit, Turtle, Baby, Skull
} from 'lucide-react'
import { Sector } from '../store/settingsStore'

export const ICONS = [
    { value: 'briefcase', icon: Briefcase, label: 'Trabalho' },
    { value: 'heart', icon: Heart, label: 'Saúde' },
    { value: 'user', icon: User, label: 'Pessoal' },
    { value: 'home', icon: Home, label: 'Casa' },
    { value: 'dollar-sign', icon: DollarSign, label: 'Finanças' },
    { value: 'book', icon: Book, label: 'Estudos' },
    { value: 'plane', icon: Plane, label: 'Viagem' },
    { value: 'star', icon: Star, label: 'Importante' },
    { value: 'zap', icon: Zap, label: 'Urgente' },
    { value: 'coffee', icon: Coffee, label: 'Lazer' },
    { value: 'music', icon: Music, label: 'Música' },
    { value: 'gamepad', icon: Gamepad, label: 'Games' },
    { value: 'bookmark', icon: Bookmark, label: 'Outros' },
    { value: 'tag', icon: Tag, label: 'Tag' },
    { value: 'shopping-bag', icon: ShoppingBag, label: 'Compras' },
    { value: 'dumbbell', icon: Dumbbell, label: 'Treino' },
    { value: 'clapperboard', icon: Clapperboard, label: 'Filmes' },
    { value: 'gift', icon: Gift, label: 'Presentes' },
    { value: 'globe', icon: Globe, label: 'Internet' },
    { value: 'camera', icon: Camera, label: 'Fotos' },
    { value: 'wrench', icon: Wrench, label: 'Manutenção' }
]

export const AVATAR_ICONS = [
    { value: 'crown', label: 'Coroa', icon: Crown },
    { value: 'user-circle', label: 'Usuário', icon: UserCircle },
    { value: 'baby', label: 'Bebê', icon: Baby },
    { value: 'smile', label: 'Sorriso', icon: Smile },
    { value: 'ghost', label: 'Fantasma', icon: Ghost },
    { value: 'skull', label: 'Caveira', icon: Skull },
    { value: 'cat', label: 'Gato', icon: Cat },
    { value: 'dog', label: 'Cachorro', icon: Dog },
    { value: 'rabbit', label: 'Coelho', icon: Rabbit },
    { value: 'bird', label: 'Pássaro', icon: Bird },
    { value: 'turtle', label: 'Tartaruga', icon: Turtle },
    { value: 'fish', label: 'Peixe', icon: Fish },
    { value: 'bug', label: 'Bug', icon: Bug },
    { value: 'rocket', label: 'Foguete', icon: Rocket },
    { value: 'trophy', label: 'Troféu', icon: Trophy },
]

export const COLORS: { value: Sector['color'], hex: string, label: string }[] = [
    // Quentes
    { value: 'red', hex: '#ef4444', label: 'Vermelho' },
    { value: 'orange', hex: '#f97316', label: 'Laranja' },
    { value: 'amber', hex: '#f59e0b', label: 'Âmbar' },
    { value: 'yellow', hex: '#eab308', label: 'Amarelo' },

    // Frios & Frescos
    { value: 'lime', hex: '#84cc16', label: 'Lima' },
    { value: 'green', hex: '#10b981', label: 'Verde' },
    { value: 'teal', hex: '#14b8a6', label: 'Verde Água' },
    { value: 'cyan', hex: '#06b6d4', label: 'Ciano' },
    { value: 'sky', hex: '#0ea5e9', label: 'Céu' },
    { value: 'blue', hex: '#3b82f6', label: 'Azul' },

    // Roxo & Rosa
    { value: 'indigo', hex: '#6366f1', label: 'Índigo' },
    { value: 'violet', hex: '#8b5cf6', label: 'Violeta' },
    { value: 'purple', hex: '#a855f7', label: 'Roxo' },
    { value: 'fuchsia', hex: '#d946ef', label: 'Fúcsia' },
    { value: 'pink', hex: '#ec4899', label: 'Rosa' },
    { value: 'rose', hex: '#f43f5e', label: 'Rose' },

    // Neutros & Terrsos
    { value: 'brown', hex: '#78350f', label: 'Marrom' },
    { value: 'slate', hex: '#64748b', label: 'Slate' },
    { value: 'gray', hex: '#6b7280', label: 'Cinza' },
    { value: 'zinc', hex: '#71717a', label: 'Zinco' },
    { value: 'stone', hex: '#78716c', label: 'Pedra' },
    { value: 'black', hex: '#1c1917', label: 'Preto' },
    { value: 'white', hex: '#ffffff', label: 'Branco' },
]
