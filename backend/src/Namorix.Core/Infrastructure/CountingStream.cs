namespace Namorix.Core.Infrastructure;

public class CountingStream(Stream inner): Stream
{
    public long BytesWritten { get; private set; }

    public override async ValueTask WriteAsync(ReadOnlyMemory<byte> buffer, CancellationToken cancellationToken = default)
    {
        BytesWritten += buffer.Length;
        await inner.WriteAsync(buffer, cancellationToken);
    }

    public override void Write(byte[] buffer, int offset, int count)
    {
        BytesWritten += count;
        inner.Write(buffer, offset, count);
    }

    public override Task FlushAsync(CancellationToken cancellationToken) =>
        inner.FlushAsync(cancellationToken);

    public override void Flush() =>
        inner.Flush();

    public override bool CanRead => inner.CanRead;
    public override bool CanSeek => inner.CanSeek;
    public override bool CanWrite => inner.CanWrite;
    public override long Length => inner.Length;

    public override long Position
    {
        get => inner.Position;
        set => inner.Position = value;
    }

    public override int Read(byte[] buffer, int offset, int count) =>
        inner.Read(buffer, offset, count);

    public override long Seek(long offset, SeekOrigin origin) =>
        inner.Seek(offset, origin);

    public override void SetLength(long value) =>
        inner.SetLength(value);
}