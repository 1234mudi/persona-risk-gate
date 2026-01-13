import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Shield, Lightbulb, XCircle, Calendar, Building2, Link, DollarSign } from "lucide-react";

interface LossEvent {
  id: string;
  description: string;
  amount: string;
  businessUnit: string;
  linkedRisk: string;
  status: string;
  date: string;
  rootCause: {
    summary: string;
    contributingFactors: string[];
    failedControls: { id: string; name: string }[];
    recommendations: string[];
  } | null;
}

interface LossEventDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: LossEvent | null;
}

export const LossEventDetailsModal: React.FC<LossEventDetailsModalProps> = ({
  open,
  onOpenChange,
  event,
}) => {
  if (!event) return null;

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-600";
      case "Under Review":
        return "bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-600";
      case "Escalated":
        return "bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 border-red-300 dark:border-red-600";
      case "Closed":
        return "bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 border-green-300 dark:border-green-600";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">{event.id}</DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">{event.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${getStatusBadgeColor(event.status)} rounded-full`}>
                {event.status}
              </Badge>
              <Badge className="rounded-full bg-destructive/10 text-destructive border-destructive/20 font-semibold">
                {event.amount}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Overview Card */}
          <Card className="border border-border/50">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="text-sm font-medium">{event.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Business Unit</p>
                    <p className="text-sm font-medium">{event.businessUnit}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Linked Risk</p>
                    <p className="text-sm font-medium">{event.linkedRisk}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Loss Amount</p>
                    <p className="text-sm font-medium text-destructive">{event.amount}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {event.rootCause ? (
            <>
              {/* Root Cause Summary */}
              <Card className="border-2 border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-red-700 dark:text-red-400 uppercase text-sm">Root Cause Analysis</span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    {event.rootCause.summary}
                  </p>
                </CardContent>
              </Card>

              {/* Contributing Factors */}
              <Card className="border-2 border-yellow-300 dark:border-yellow-700 bg-yellow-50/50 dark:bg-yellow-900/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-bold text-yellow-700 dark:text-yellow-400 uppercase text-sm">Contributing Factors</span>
                    </div>
                    <Badge className="rounded-full bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-600">
                      {event.rootCause.contributingFactors.length}
                    </Badge>
                  </div>
                  <ul className="space-y-2">
                    {event.rootCause.contributingFactors.map((factor, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm">
                        <span className="w-5 h-5 rounded-full bg-yellow-500 text-white text-xs flex items-center justify-center font-semibold flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="text-foreground">{factor}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Failed Controls */}
              <Card className="border-2 border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-900/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                        <XCircle className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-bold text-purple-700 dark:text-purple-400 uppercase text-sm">Failed Controls</span>
                    </div>
                    <Badge className="rounded-full bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-600">
                      {event.rootCause.failedControls.length}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {event.rootCause.failedControls.map((control, idx) => (
                      <span key={idx} className="inline-flex items-center gap-2 px-3 py-2 bg-purple-100 dark:bg-purple-800/50 text-purple-800 dark:text-purple-200 text-sm rounded-lg border border-purple-300 dark:border-purple-600">
                        <Shield className="w-4 h-4" />
                        <span className="font-medium">{control.id}</span>
                        <span className="text-purple-600 dark:text-purple-400">•</span>
                        <span>{control.name}</span>
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card className="border-2 border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                        <Lightbulb className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-bold text-green-700 dark:text-green-400 uppercase text-sm">Recommendations</span>
                    </div>
                    <Badge className="rounded-full bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 border-green-300 dark:border-green-600">
                      {event.rootCause.recommendations.length}
                    </Badge>
                  </div>
                  <ul className="space-y-2">
                    {event.rootCause.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm">
                        <span className="w-5 h-5 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-semibold flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="text-foreground">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border border-border/50 bg-muted/30">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No root cause analysis has been performed for this loss event yet.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
