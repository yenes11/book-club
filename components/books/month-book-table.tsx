'use client';

import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Book } from '@/lib/supabase';

interface MonthBookTableProps {
  monthLabel: string;
  books: Book[];
  columns: ColumnDef<Book>[];
  columnVisibility?: VisibilityState;
}

export function MonthBookTable({
  monthLabel,
  books,
  columns,
  columnVisibility,
}: MonthBookTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data: books,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
      columnVisibility: columnVisibility || {},
    },
  });

  return (
    <div className="space-y-2">
      {/* <h2 className="text-xl font-semibold text-foreground">{monthLabel}</h2> */}
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-100">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{
                      width:
                        header.column.id === 'actions'
                          ? header.column.getSize()
                          : undefined,
                    }}
                    className={cn(
                      header.column.getCanSort() &&
                        'cursor-pointer select-none hover:bg-gray-200'
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder ? null : (
                      <div className="flex items-center gap-2">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <span className="flex items-center">
                            {header.column.getIsSorted() === 'desc' ? (
                              <ArrowDown className="h-4 w-4" />
                            ) : header.column.getIsSorted() === 'asc' ? (
                              <ArrowUp className="h-4 w-4" />
                            ) : (
                              <ArrowUpDown className="h-4 w-4 opacity-50" />
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        'p-0',
                        cell.column.id === 'description' &&
                          'max-w-md overflow-hidden'
                      )}
                      style={{
                        width:
                          cell.column.id === 'actions'
                            ? cell.column.getSize()
                            : undefined,
                      }}
                    >
                      <div
                        className={cn(
                          'h-full min-h-10 px-2',
                          cell.column.id === 'description'
                            ? 'py-2'
                            : 'flex items-center'
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Bu ay için kitap yok.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
