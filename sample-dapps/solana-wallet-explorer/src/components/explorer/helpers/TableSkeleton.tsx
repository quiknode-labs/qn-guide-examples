import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";

interface TableSkeletonProps {
    numRows: number;
}

const TableSkeleton = ({
    numRows
}: TableSkeletonProps) => {
    return (
        Array(numRows).fill({}).map((_, index) => (
            <TableRow className="divide-x" key={index}>
                <TableCell><Skeleton className="h-6 rounded-md" /></TableCell>
                <TableCell><Skeleton className="h-6 rounded-md" /></TableCell>
                <TableCell><Skeleton className="h-6 rounded-md" /></TableCell>
            </TableRow>
        ))
    )
}

export default TableSkeleton;