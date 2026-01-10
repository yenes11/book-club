'use client';

import { Button } from '@/components/ui/button';
import {
  Plus,
  Trash2,
  ArrowRight,
  EyeOff,
  Eye,
  MoreVertical,
} from 'lucide-react';
import { MonthPickerInput } from '@/components/ui/month-picker-input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BooksHeaderProps {
  selectedMonth: Date | null;
  onMonthChange: (month: Date | null) => void;
  onAddClick: () => void;
  showNameAndAuthor: boolean;
  onToggleNameAndAuthor: () => void;
  onDeleteAllClick: () => void;
  onTransferToNextMonth: () => void;
  hasBooks: boolean;
  hasBooksInSelectedMonth: boolean;
}

export function BooksHeader({
  selectedMonth,
  onMonthChange,
  onAddClick,
  showNameAndAuthor,
  onToggleNameAndAuthor,
  onDeleteAllClick,
  onTransferToNextMonth,
  hasBooks,
  hasBooksInSelectedMonth,
}: BooksHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">
        Kitaplar
      </h1>
      <div className="flex gap-2 items-center">
        <MonthPickerInput
          value={selectedMonth}
          onChange={(value) => onMonthChange(value as Date | null)}
          placeholder="Ay seçin"
          clearable
          className="w-[200px]"
        />

        {/* Desktop butonları - md ve üzeri ekranlarda görünür */}
        <div className="hidden lg:flex gap-2 items-center">
          <Button variant="outline" size="sm" onClick={onToggleNameAndAuthor}>
            {showNameAndAuthor ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            {showNameAndAuthor ? 'İsim ve Yazar Gizle' : 'İsim ve Yazar Göster'}
          </Button>
          {hasBooksInSelectedMonth && selectedMonth && (
            <Button
              className="bg-black hover:bg-black/80"
              onClick={onTransferToNextMonth}
              size="sm"
            >
              <ArrowRight className="h-4 w-4" />
              Sonraki Aya Aktar
            </Button>
          )}
          {hasBooks && (
            <Button
              variant="destructive"
              onClick={onDeleteAllClick}
              size="sm"
              className="hover:bg-destructive/80"
            >
              <Trash2 className="h-4 w-4" />
              Tümünü Sil
            </Button>
          )}
          <Button
            className="bg-primary hover:bg-primary/80"
            onClick={onAddClick}
            size="sm"
          >
            <Plus className="h-4 w-4 text-white" />
            Kitap Ekle
          </Button>
        </div>

        {/* Mobil dropdown menü - md'den küçük ekranlarda görünür */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="lg:hidden">
            <Button variant="outline" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onAddClick}>
              <Plus className="h-4 w-4" />
              Kitap Ekle
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onToggleNameAndAuthor}>
              {showNameAndAuthor ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              {showNameAndAuthor
                ? 'İsim ve Yazar Gizle'
                : 'İsim ve Yazar Göster'}
            </DropdownMenuItem>
            {hasBooksInSelectedMonth && selectedMonth && (
              <DropdownMenuItem onClick={onTransferToNextMonth}>
                <ArrowRight className="h-4 w-4" />
                Sonraki Aya Aktar
              </DropdownMenuItem>
            )}
            {hasBooks && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={onDeleteAllClick}
                >
                  <Trash2 className="h-4 w-4" />
                  Tümünü Sil
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
