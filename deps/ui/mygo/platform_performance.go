//go:build darwin || linux || windows

package main

import (
	"encoding/json"
	"runtime/metrics"
	"time"
)

type platformPerformance struct {
	buildMilliseconds *float64
}

func (p *platformPerformance) noteBuild(start time.Time) {
	ms := float64(time.Since(start)) / float64(time.Millisecond)
	p.buildMilliseconds = &ms
}

func (p *platformPerformance) sample() (platformReply, error) {
	samples := []metrics.Sample{
		{Name: "/memory/classes/heap/objects:bytes"},
		{Name: "/memory/classes/total:bytes"},
		{Name: "/gc/cycles/total:gc-cycles"},
	}
	metrics.Read(samples)
	payload, err := json.Marshal(struct {
		BuildMilliseconds *float64 `json:"host_build_ms"`
		HeapBytes         uint64   `json:"go_heap_bytes"`
		RuntimeBytes      uint64   `json:"go_runtime_bytes"`
		GCCycles          uint64   `json:"go_gc_cycles"`
	}{p.buildMilliseconds, samples[0].Value.Uint64(), samples[1].Value.Uint64(), samples[2].Value.Uint64()})
	return platformReply{Name: "mygo-performance", Payload: string(payload)}, err
}
