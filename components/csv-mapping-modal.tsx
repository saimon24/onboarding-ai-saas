import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface CSVMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  csvHeaders: string[];
  onStartImport: (mapping: Record<string, string>) => void;
}

export function CSVMappingModal({
  isOpen,
  onClose,
  csvHeaders,
  onStartImport,
}: CSVMappingModalProps) {
  const [mapping, setMapping] = React.useState<Record<string, string>>({});
  const [errors, setErrors] = React.useState<string[]>([]);

  const handleFieldMapping = (field: string, csvHeader: string) => {
    setMapping(prev => ({
      ...prev,
      [field]: csvHeader
    }));
  };

  const validateMapping = () => {
    const newErrors: string[] = [];

    // Check if email is mapped
    if (!mapping.email) {
      newErrors.push('Email field is required');
    }

    // Check for duplicate mappings
    const mappedValues = Object.values(mapping);
    const duplicates = mappedValues.filter(
      (value, index) => value && mappedValues.indexOf(value) !== index
    );
    if (duplicates.length > 0) {
      newErrors.push('Each CSV column can only be mapped once');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleStartImport = () => {
    if (validateMapping()) {
      onStartImport(mapping);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Map CSV Columns</DialogTitle>
          <DialogDescription>
            Map your CSV columns to the appropriate fields. Only email is required, select which additional fields you want to import.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-4">
            {errors.length > 0 && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <p className="font-medium">Validation Errors</p>
                </div>
                <ul className="list-disc list-inside mt-2 text-sm">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-6">
              {/* Required Email Field */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-medium">Email</h3>
                  <Badge variant="destructive">Required</Badge>
                </div>
                <Select
                  value={mapping.email}
                  onValueChange={(value) => handleFieldMapping('email', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select the email column" />
                  </SelectTrigger>
                  <SelectContent>
                    {csvHeaders.map(header => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Survey Data Fields */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="font-medium">Additional Fields</h3>
                  <Badge variant="secondary">Optional</Badge>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {csvHeaders.map(header => (
                    header !== mapping.email && (
                      <div key={header} className="flex items-center space-x-2">
                        <Checkbox
                          id={header}
                          checked={mapping[header] === header}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleFieldMapping(header, header);
                            } else {
                              const { [header]: _, ...rest } = mapping;
                              setMapping(rest);
                            }
                          }}
                        />
                        <label
                          htmlFor={header}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {header}
                        </label>
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleStartImport}>
            Start Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}