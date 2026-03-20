import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Search,
} from 'lucide-react';
import { useState } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export interface Column<T> {
    key: string;
    title: string;
    sortable?: boolean;
    cell: (item: T) => React.ReactNode;
}

export interface PaginationData {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    pagination?: PaginationData;
    onPageChange?: (page: number) => void;
    onSort?: (column: string, direction: SortDirection) => void;
    sortColumn?: string;
    sortDirection?: SortDirection;
    isLoading?: boolean;
    searchable?: boolean;
    onSearch?: (query: string) => void;
    searchPlaceholder?: string;
    actions?: (item: T) => React.ReactNode;
    emptyMessage?: string;
}

export function DataTable<T>({
    data,
    columns,
    pagination,
    onPageChange,
    onSort,
    sortColumn,
    sortDirection,
    isLoading = false,
    searchable = true,
    onSearch,
    searchPlaceholder = 'Search...',
    actions,
    emptyMessage = 'No data available',
}: DataTableProps<T>) {
    const [searchQuery, setSearchQuery] = useState('');
    const [itemsPerPage, setItemsPerPage] = useState(pagination?.per_page || 10);

    const handleSearch = (value: string) => {
        setSearchQuery(value);
        onSearch?.(value);
    };

    const handleSort = (columnKey: string) => {
        if (!onSort) return;

        const column = columns.find((c) => c.key === columnKey);
        if (!column?.sortable) return;

        let newDirection: SortDirection = 'asc';
        if (sortColumn === columnKey) {
            if (sortDirection === 'asc') {
                newDirection = 'desc';
            } else if (sortDirection === 'desc') {
                newDirection = null;
            }
        }

        onSort(columnKey, newDirection);
    };

    const getSortIcon = (columnKey: string) => {
        if (sortColumn !== columnKey) {
            return <ArrowUpDown className="h-4 w-4 opacity-20" />;
        }

        if (sortDirection === 'asc') {
            return <ArrowUpDown className="h-4 w-4" />;
        }
        if (sortDirection === 'desc') {
            return <ArrowUpDown className="h-4 w-4 rotate-180" />;
        }
        return <ArrowUpDown className="h-4 w-4 opacity-20" />;
    };

    return (
        <div className="space-y-4">
            {/* Header with Search and Pagination Controls */}
            <div className="flex items-center justify-between">
                {searchable && onSearch && (
                    <div className="relative w-72">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={searchPlaceholder}
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                )}

                {pagination && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                            Rows per page:
                        </span>
                        <Select
                            value={String(itemsPerPage)}
                            onValueChange={(value) => {
                                setItemsPerPage(Number(value));
                                // You might want to call onPageChange(1) here
                            }}
                        >
                            <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent side="top">
                                {[10, 20, 30, 50, 100].map((size) => (
                                    <SelectItem key={size} value={String(size)}>
                                        {size}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((column) => (
                                <TableHead
                                    key={column.key}
                                    className={cn(
                                        column.sortable &&
                                            'cursor-pointer hover:bg-muted/50 transition-colors'
                                    )}
                                    onClick={() =>
                                        column.sortable && handleSort(column.key)
                                    }
                                >
                                    <div className="flex items-center gap-2">
                                        {column.title}
                                        {column.sortable && getSortIcon(column.key)}
                                    </div>
                                </TableHead>
                            ))}
                            {actions && <TableHead className="w-[70px]">Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length + (actions ? 1 : 0)}
                                    className="h-24 text-center"
                                >
                                    <div className="flex items-center justify-center">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length + (actions ? 1 : 0)}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((item, index) => (
                                <TableRow key={index}>
                                    {columns.map((column) => (
                                        <TableCell key={column.key}>
                                            {column.cell(item)}
                                        </TableCell>
                                    ))}
                                    {actions && (
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                {actions(item)}
                                            </div>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Footer */}
            {pagination && (
                <div className="flex items-center justify-between px-2">
                    <div className="text-sm text-muted-foreground">
                        {pagination.total === 0
                            ? 'No results'
                            : `Showing ${pagination.from} to ${pagination.to} of ${pagination.total} results`}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange?.(pagination.current_page - 1)}
                            disabled={pagination.current_page === 1 || isLoading}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>

                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                                let pageNum: number;
                                const totalPages = pagination.last_page;
                                const currentPage = pagination.current_page;

                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }

                                return (
                                    <Button
                                        key={pageNum}
                                        variant={currentPage === pageNum ? 'default' : 'outline'}
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() => onPageChange?.(pageNum)}
                                        disabled={isLoading}
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            })}
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange?.(pagination.current_page + 1)}
                            disabled={
                                pagination.current_page === pagination.last_page ||
                                isLoading
                            }
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
