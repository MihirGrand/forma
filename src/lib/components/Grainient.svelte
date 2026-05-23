<script lang="ts">
</script>

<div class="fixed inset-0 z-0 overflow-hidden pointer-events-none">
    <!-- Base background -->
    <div class="absolute inset-0 bg-zinc-950"></div>
    
    <!-- Primary Orange / Amber Gradients -->
    <div class="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-amber-500/20 blur-[120px] mix-blend-screen animate-pulse" style="animation-duration: 8s;"></div>
    <div class="absolute bottom-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-orange-600/20 blur-[100px] mix-blend-screen animate-pulse" style="animation-duration: 10s; animation-delay: 1s;"></div>
    
    <!-- Grain overlay -->
    <div class="absolute inset-0 opacity-[0.06]" style="background-image: url(&quot;data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E&quot;);"></div>
</div>
