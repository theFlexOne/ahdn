# FFmpeg CLI Parameter Reference

Most common options are listed first, followed by grouped option categories.

---

# Most Common FFmpeg Parameters

| Parameter | Description |
|---|---|
| `-i <url>` | Input file, stream, device, or URL. |
| `-f <fmt>` | Force input or output format. |
| `-c[:stream] <codec>` | Set codec for one or more streams. |
| `-map <spec>` | Select which input streams are included in the output. |
| `-ss <time>` | Seek to a specific position in the input or output. |
| `-t <duration>` | Limit processing to a specified duration. |
| `-to <time>` | Stop writing output at an absolute position. |
| `-filter[:stream] <graph>` | Apply a filtergraph to a stream. |
| `-vf <graph>` | Video filtergraph (alias for `-filter:v`). |
| `-af <graph>` | Audio filtergraph (alias for `-filter:a`). |
| `-filter_complex <graph>` | Apply a complex multi-input filtergraph. |
| `-r[:stream] <fps>` | Set output frame rate. |
| `-s[:stream] <size>` | Set frame size (e.g. `1920x1080`). |
| `-pix_fmt[:stream] <fmt>` | Set pixel format. |
| `-ar[:stream] <freq>` | Set audio sample rate. |
| `-ac[:stream] <channels>` | Set number of audio channels. |
| `-q[:stream] <value>` | Set encoder quality scale. |
| `-frames[:stream] <count>` | Limit number of frames written. |
| `-vn` | Disable video. |
| `-an` | Disable audio. |
| `-sn` | Disable subtitles. |
| `-dn` | Disable data streams. |
| `-y` | Overwrite output files without prompting. |
| `-n` | Do not overwrite existing output files. |
| `-metadata key=value` | Set metadata value. |
| `-progress <url>` | Send machine-readable progress output. |
| `-stats` | Display encoding statistics during processing. |

---

# Generic Options

| Parameter | Description |
|---|---|
| `-L` | Show license information. |
| `-h` | Show help. |
| `-version` | Show FFmpeg version information. |
| `-buildconf` | Show build configuration. |
| `-formats` | List supported formats. |
| `-muxers` | List available muxers. |
| `-demuxers` | List available demuxers. |
| `-devices` | List available devices. |
| `-codecs` | List all codecs. |
| `-encoders` | List available encoders. |
| `-decoders` | List available decoders. |
| `-filters` | List available filters. |
| `-protocols` | List supported protocols. |
| `-pix_fmts` | List supported pixel formats. |
| `-sample_fmts` | List audio sample formats. |
| `-layouts` | List channel layouts. |
| `-loglevel <level>` | Set logging verbosity. |
| `-report` | Generate a log file with diagnostic info. |
| `-hide_banner` | Hide startup banner information. |
| `-cpuflags <flags>` | Force specific CPU feature flags. |

---

# Input / Output Control

| Parameter | Description |
|---|---|
| `-stream_loop <count>` | Loop an input stream multiple times. |
| `-fs <size>` | Limit output file size. |
| `-itsoffset <time>` | Offset input timestamps. |
| `-itsscale <scale>` | Scale input timestamps. |
| `-timestamp <date>` | Set output container timestamp. |
| `-recast_media` | Allow forcing decoders of different media types. |

---

# Video Options

| Parameter | Description |
|---|---|
| `-vframes <count>` | Limit number of video frames. |
| `-aspect <ratio>` | Set display aspect ratio. |
| `-vcodec <codec>` | Set video codec (alias for `-c:v`). |
| `-vf <filtergraph>` | Apply video filtergraph. |
| `-autorotate` | Automatically rotate video according to metadata. |
| `-noautorotate` | Disable automatic rotation. |
| `-autoscale` | Automatically scale frames to output size. |
| `-noautoscale` | Disable automatic scaling. |

---

# Advanced Video Options

| Parameter | Description |
|---|---|
| `-pix_fmt <format>` | Set pixel format. |
| `-sws_flags <flags>` | Configure scaling algorithm. |
| `-vtag <fourcc>` | Force video codec tag. |
| `-force_key_frames <times>` | Force keyframes at specific times. |
| `-copyinkf` | Copy initial non-keyframes during stream copy. |
| `-hwaccel <method>` | Enable hardware decoding acceleration. |
| `-hwaccel_device <device>` | Select hardware acceleration device. |
| `-hwaccel_output_format <format>` | Set hardware output pixel format. |

---

# Audio Options

| Parameter | Description |
|---|---|
| `-aframes <count>` | Limit number of audio frames. |
| `-aq <quality>` | Set audio quality scale. |
| `-acodec <codec>` | Set audio codec (alias for `-c:a`). |
| `-sample_fmt <format>` | Set audio sample format. |
| `-af <filtergraph>` | Apply audio filtergraph. |

---

# Advanced Audio Options

| Parameter | Description |
|---|---|
| `-atag <fourcc>` | Force audio codec tag. |
| `-channel_layout <layout>` | Set audio channel layout. |
| `-guess_layout_max <channels>` | Limit automatic channel layout guessing. |

---

# Subtitle Options

| Parameter | Description |
|---|---|
| `-scodec <codec>` | Set subtitle codec. |
| `-fix_sub_duration` | Correct subtitle durations. |
| `-canvas_size <size>` | Set subtitle rendering canvas size. |

---

# Stream Mapping and Metadata

| Parameter | Description |
|---|---|
| `-map <spec>` | Map input streams to output streams. |
| `-map_metadata <spec>` | Copy metadata from input to output. |
| `-map_chapters <index>` | Copy chapters from input file. |
| `-program ...` | Define output program streams. |
| `-stream_group ...` | Create grouped streams in output. |

---

# Diagnostics and Debugging

| Parameter | Description |
|---|---|
| `-benchmark` | Show encoding performance benchmarks. |
| `-benchmark_all` | Benchmark all pipeline stages. |
| `-debug_ts` | Print timestamp debugging information. |
| `-dump` | Dump each input packet. |
| `-hex` | Show packet payload in hex format. |
| `-xerror` | Exit immediately on error. |

---

# Timing and Synchronization

| Parameter | Description |
|---|---|
| `-vsync <mode>` | Control video synchronization. |
| `-fps_mode <mode>` | Control frame rate mode. |
| `-async <samples>` | Stretch or squeeze audio to sync. |
| `-copyts` | Preserve input timestamps. |
| `-start_at_zero` | Shift timestamps to start at zero. |
| `-copytb <mode>` | Copy input timebase in stream copy mode. |

---

# Muxing and Buffer Control

| Parameter | Description |
|---|---|
| `-max_muxing_queue_size <packets>` | Maximum packets buffered while muxing. |
| `-muxdelay <seconds>` | Maximum muxing delay. |
| `-muxpreload <seconds>` | Initial muxing delay. |
| `-shortest` | Finish encoding when shortest stream ends. |
| `-shortest_buf_duration <seconds>` | Buffer duration used with `-shortest`. |
| `-flush_packets <1|0>` | Flush packets immediately. |

---