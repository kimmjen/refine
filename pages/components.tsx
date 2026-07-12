import Head from 'next/head';
import LayoutShell from '@/components/layout/LayoutShell';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '@/next-i18next.config.js';
import type { GetStaticProps } from 'next';

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'], nextI18NextConfig)),
  },
});
import RefineLogo from '@/components/common/RefineLogo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Plus, ChevronDown, AlertTriangle, Info, Check, X, Loader2, CheckCircle2, Sparkles, Share2, Sidebar } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

import LinkDetailCard from '@/components/modules/link/LinkDetailCard';
import { Skeleton } from "@/components/ui/skeleton";
import { DUMMY_LINK, DUMMY_METADATA } from '@/lib/dummy-data';

export default function ComponentsPage() {
    const [dialogOpen, setDialogOpen] = useState(false);

    return (
        <>
            <Head><title>UI Kit | Refine</title></Head>
            <LayoutShell>
                <div className="max-w-5xl mx-auto pt-6 px-4 pb-20 space-y-12">
                    <header className="space-y-2">
                        <h1 className="text-2xl font-bold">UI Kit</h1>
                        <p className="text-sm text-muted-foreground">PWA 앱의 모든 UI 컴포넌트 및 상태 화면</p>
                    </header>

                    <section className="space-y-4 border-b pb-12">
                        <header>
                            <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                                <Sparkles size={20} />
                                Knowledge Card Redesign
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                새로운 매거진 스타일의 상세 페이지 디자인입니다. (Knowledge Card Concept)
                            </p>
                        </header>

                        <div className="rounded-2xl border bg-muted/20 p-4 md:p-8">
                            <div className="max-w-3xl mx-auto bg-background rounded-xl shadow-sm border overflow-hidden">
                                <div className="p-4 md:p-6">
                                    <LinkDetailCard
                                        link={DUMMY_LINK}
                                        metadata={DUMMY_METADATA}
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* PWA States Section */}
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold">PWA States</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Splash Screen - current theme */}
                            <Card className="aspect-[9/16] flex flex-col items-center justify-center bg-background border-2">
                                <div className="h-16 w-16 rounded-xl bg-primary flex items-center justify-center mb-4">
                                    <Sparkles className="h-8 w-8 text-primary-foreground" />
                                </div>
                                <p className="text-sm font-semibold">refine</p>
                                <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest">Splash Screen</p>
                            </Card>

                            {/* Loading State */}
                            <Card className="aspect-[9/16] flex flex-col items-center justify-center bg-background border-2">
                                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                                <p className="text-sm font-medium">Loading...</p>
                                <p className="text-[10px] text-muted-foreground mt-1">데이터를 불러오는 중</p>
                            </Card>

                            {/* Success State */}
                            <Card className="aspect-[9/16] flex flex-col items-center justify-center bg-background border-2">
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="h-16 w-16 rounded-full bg-green-500 flex items-center justify-center mb-4"
                                >
                                    <CheckCircle2 className="h-8 w-8 text-white" />
                                </motion.div>
                                <p className="text-sm font-semibold">Saved!</p>
                                <p className="text-[10px] text-muted-foreground mt-1">라이브러리에 추가됨</p>
                            </Card>
                        </div>

                        {/* Share Intent Flow */}
                        <div className="mt-6">
                            <h3 className="text-sm font-medium mb-3 flex items-center gap-2"><Share2 size={14} />Share Intent Flow</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Step 1: Analyzing */}
                                <Card className="p-6 flex flex-col items-center text-center">
                                    <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
                                    <p className="text-sm font-semibold">1. Analyzing...</p>
                                    <p className="text-[10px] text-muted-foreground mt-1">링크 정보 읽는 중</p>
                                </Card>

                                {/* Step 2: Categorize - Full Preview */}
                                <Card className="p-4 md:col-span-2">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                                            <Sparkles size={14} className="text-primary-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold">2. Save to Refine</p>
                                            <p className="text-[10px] text-muted-foreground">카테고리 선택</p>
                                        </div>
                                    </div>

                                    {/* Mock Form */}
                                    <div className="bg-muted/50 p-3 rounded-lg space-y-2 mb-3">
                                        <div className="space-y-1">
                                            <label className="text-[9px] uppercase text-muted-foreground">Title</label>
                                            <div className="h-8 bg-background rounded-md border flex items-center px-2 text-xs">Instagram Post</div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] uppercase text-muted-foreground">Note</label>
                                            <div className="h-12 bg-background rounded-md border flex items-start p-2 text-[10px] text-muted-foreground">메모를 입력하세요...</div>
                                        </div>
                                        <p className="text-[9px] font-mono text-muted-foreground truncate">https://instagram.com/p/...</p>
                                    </div>

                                    {/* Category Chips */}
                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                        {['Tech', 'Design', 'Article', 'Video', 'Social', 'Etc'].map(cat => (
                                            <Badge key={cat} variant={cat === 'Social' ? 'default' : 'outline'} className="text-[9px] h-6 px-2">{cat}</Badge>
                                        ))}
                                    </div>

                                    {/* Save Button */}
                                    <Button className="w-full h-9 text-xs">Save to Library</Button>
                                </Card>
                            </div>

                            {/* Step 3: Success */}
                            <Card className="p-6 flex flex-col items-center text-center mt-4">
                                <CheckCircle2 className="h-10 w-10 text-green-500 mb-3" />
                                <p className="text-sm font-semibold">3. Saved!</p>
                                <p className="text-[10px] text-muted-foreground mt-1">라이브러리에 추가됨 → 홈으로 이동</p>
                            </Card>
                        </div>
                    </section>

                    {/* Buttons */}
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold">Buttons</h2>
                        <div className="flex flex-wrap gap-3">
                            <Button>Default</Button>
                            <Button variant="secondary">Secondary</Button>
                            <Button variant="outline">Outline</Button>
                            <Button variant="ghost">Ghost</Button>
                            <Button variant="destructive">Destructive</Button>
                            <Button variant="link">Link</Button>
                            <Button size="sm">Small</Button>
                            <Button size="lg">Large</Button>
                            <Button size="icon"><Plus size={16} /></Button>
                            <Button disabled><Loader2 size={14} className="animate-spin mr-2" />Loading</Button>
                        </div>
                    </section>

                    {/* Badges */}
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold">Badges</h2>
                        <div className="flex flex-wrap gap-3">
                            <Badge>Default</Badge>
                            <Badge variant="secondary">Secondary</Badge>
                            <Badge variant="outline">Outline</Badge>
                            <Badge variant="destructive">Destructive</Badge>
                        </div>
                    </section>

                    {/* Inputs */}
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold">Inputs</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
                            <Input placeholder="Text input..." />
                            <Input type="email" placeholder="Email..." />
                            <Textarea placeholder="Textarea..." className="md:col-span-2" />
                        </div>
                    </section>

                    {/* Cards */}
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold">Cards</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card>
                                <CardHeader><CardTitle className="text-sm">Card Title</CardTitle><CardDescription className="text-xs">Card description</CardDescription></CardHeader>
                                <CardContent><p className="text-xs text-muted-foreground">Card content here.</p></CardContent>
                                <CardFooter><Button size="sm" className="w-full">Action</Button></CardFooter>
                            </Card>
                            <Card className="border-primary/50">
                                <CardHeader><CardTitle className="text-sm">Featured</CardTitle></CardHeader>
                                <CardContent><Badge>Popular</Badge></CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-6 text-center"><p className="text-2xl font-bold">42</p><p className="text-xs text-muted-foreground">Total Items</p></CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* Alerts */}
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold">Alerts</h2>
                        <div className="space-y-3 max-w-xl">
                            <Alert><Info className="h-4 w-4" /><AlertTitle>Info</AlertTitle><AlertDescription>This is an informational alert.</AlertDescription></Alert>
                            <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>Something went wrong.</AlertDescription></Alert>
                        </div>
                    </section>

                    {/* Tabs */}
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold">Tabs</h2>
                        <Tabs defaultValue="tab1" className="max-w-md">
                            <TabsList>
                                <TabsTrigger value="tab1">Tab 1</TabsTrigger>
                                <TabsTrigger value="tab2">Tab 2</TabsTrigger>
                                <TabsTrigger value="tab3">Tab 3</TabsTrigger>
                            </TabsList>
                            <TabsContent value="tab1" className="p-4 border rounded-lg mt-2">Content for Tab 1</TabsContent>
                            <TabsContent value="tab2" className="p-4 border rounded-lg mt-2">Content for Tab 2</TabsContent>
                            <TabsContent value="tab3" className="p-4 border rounded-lg mt-2">Content for Tab 3</TabsContent>
                        </Tabs>
                    </section>

                    {/* Dropdown */}
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold">Dropdown Menu</h2>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="gap-2">Options <ChevronDown size={14} /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem><Check className="mr-2 h-4 w-4" />Approve</DropdownMenuItem>
                                <DropdownMenuItem><X className="mr-2 h-4 w-4" />Reject</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </section>

                    {/* Dialog */}
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold">Dialog</h2>
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild><Button>Open Dialog</Button></DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Dialog Title</DialogTitle><DialogDescription>This is a dialog description.</DialogDescription></DialogHeader>
                                <p className="text-sm text-muted-foreground py-4">Dialog content goes here.</p>
                                <DialogFooter><Button onClick={() => setDialogOpen(false)}>Close</Button></DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </section>

                    {/* Carousel */}
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold">Carousel</h2>
                        <Carousel className="max-w-md">
                            <CarouselContent>
                                {[1, 2, 3, 4].map(n => (
                                    <CarouselItem key={n}>
                                        <Card><CardContent className="flex aspect-square items-center justify-center p-6"><span className="text-3xl font-bold">{n}</span></CardContent></Card>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious />
                            <CarouselNext />
                        </Carousel>
                    </section>

                    {/* Logo */}
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold">Logo</h2>
                        <div className="flex items-center gap-6">
                            <RefineLogo size={20} />
                            <RefineLogo size={28} />
                            <RefineLogo size={40} />
                        </div>
                    </section>

                    {/* Skeleton */}
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold">Skeleton</h2>
                        <p className="text-xs text-muted-foreground">로딩 상태에서 사용됩니다. (link/[id].tsx 등)</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Card skeleton */}
                            <Card className="p-6 space-y-4">
                                <Skeleton className="h-48 w-full rounded-xl" />
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-3/4" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                                <div className="flex gap-2">
                                    <Skeleton className="h-6 w-16 rounded-full" />
                                    <Skeleton className="h-6 w-20 rounded-full" />
                                </div>
                            </Card>

                            {/* Profile skeleton */}
                            <Card className="p-6 space-y-4">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                </div>
                                <Skeleton className="h-24 w-full rounded-lg" />
                                <div className="flex gap-3">
                                    <Skeleton className="h-9 w-24 rounded-md" />
                                    <Skeleton className="h-9 w-24 rounded-md" />
                                </div>
                            </Card>
                        </div>
                    </section>

                    {/* New Components Showcase */}
                    <div className="border-t pt-8 space-y-12">
                        <header>
                            <h2 className="text-xl font-bold">New Components (Phase 5)</h2>
                        </header>

                        {/* Tooltip */}
                        <section className="space-y-4">
                            <h2 className="text-lg font-semibold">Tooltip</h2>
                            <div className="flex gap-4">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild><Button variant="outline" size="icon"><Info size={16} /></Button></TooltipTrigger>
                                        <TooltipContent><p>This is a tooltip</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </section>

                        {/* Separator */}
                        <section className="space-y-4">
                            <h2 className="text-lg font-semibold">Separator</h2>
                            <div className="space-y-1">
                                <h4 className="text-sm font-medium leading-none">Radix Primitives</h4>
                                <p className="text-sm text-muted-foreground">An open-source UI component library.</p>
                            </div>
                            <Separator className="my-4" />
                            <div className="flex h-5 items-center space-x-4 text-sm">
                                <div>Blog</div>
                                <Separator orientation="vertical" />
                                <div>Docs</div>
                                <Separator orientation="vertical" />
                                <div>Source</div>
                            </div>
                        </section>

                        {/* Scroll Area */}
                        <section className="space-y-4">
                            <h2 className="text-lg font-semibold">Scroll Area</h2>
                            <ScrollArea className="h-40 w-full rounded-md border p-4">
                                <p className="text-sm">
                                    Jokester began sneaking into the castle in the middle of the night...
                                    {Array.from({ length: 20 }).map((_, i) => (
                                        <span key={i} className="block mt-2 text-muted-foreground">Line {i + 1}: Some long content to scroll through.</span>
                                    ))}
                                </p>
                            </ScrollArea>
                        </section>

                        {/* Sheet */}
                        <section className="space-y-4">
                            <h2 className="text-lg font-semibold">Sheet</h2>
                            <Sheet>
                                <SheetTrigger asChild><Button variant="outline"><Sidebar className="mr-2 h-4 w-4" />Open Sheet</Button></SheetTrigger>
                                <SheetContent>
                                    <SheetHeader>
                                        <SheetTitle>Edit profile</SheetTitle>
                                        <SheetDescription>Make changes to your profile here.</SheetDescription>
                                    </SheetHeader>
                                    <div className="py-4">Sheet content...</div>
                                </SheetContent>
                            </Sheet>
                        </section>

                        {/* Chart */}
                        <section className="space-y-4">
                            <h2 className="text-lg font-semibold">Chart</h2>
                            <Card className="max-w-md">
                                <CardHeader><CardTitle>Bar Chart</CardTitle></CardHeader>
                                <CardContent>
                                    <ChartContainer config={{ desktop: { label: "Desktop", color: "hsl(var(--primary))" } }} className="min-h-[200px] w-full">
                                        <BarChart data={[
                                            { month: "Jan", desktop: 186 },
                                            { month: "Feb", desktop: 305 },
                                            { month: "Mar", desktop: 237 },
                                            { month: "Apr", desktop: 73 },
                                            { month: "May", desktop: 209 },
                                            { month: "Jun", desktop: 214 },
                                        ]}>
                                            <CartesianGrid vertical={false} />
                                            <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => value.slice(0, 3)} />
                                            <ChartTooltip content={<ChartTooltipContent />} />
                                            <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
                                        </BarChart>
                                    </ChartContainer>
                                </CardContent>
                            </Card>
                        </section>
                    </div>
                </div>
            </LayoutShell>
        </>
    );
}
