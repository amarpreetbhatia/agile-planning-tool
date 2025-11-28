'use client';

import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24
    }
  }
};

export function SessionSkeleton() {
  return (
    <motion.div 
      className="container mx-auto p-4 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header Skeleton */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 animate-pulse" />
          <Skeleton className="h-4 w-48 animate-pulse" />
        </div>
        <Skeleton className="h-10 w-32 animate-pulse" />
      </motion.div>

      {/* Main Content Skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Participants Skeleton */}
        <motion.div variants={itemVariants}>
          <Card className="lg:col-span-1">
            <CardHeader>
              <Skeleton className="h-6 w-32 animate-pulse" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map((i) => (
                <motion.div 
                  key={i} 
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Skeleton className="h-10 w-10 rounded-full animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-24 animate-pulse" />
                    <Skeleton className="h-3 w-16 animate-pulse" />
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Story and Cards Skeleton */}
        <div className="lg:col-span-2 space-y-6">
          {/* Story Skeleton */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48 animate-pulse" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full animate-pulse" />
                <Skeleton className="h-4 w-3/4 animate-pulse" />
              </CardContent>
            </Card>
          </motion.div>

          {/* Poker Cards Skeleton */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-4 gap-4 sm:grid-cols-5 lg:grid-cols-7">
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Skeleton className="aspect-[2/3] w-full animate-pulse" />
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
