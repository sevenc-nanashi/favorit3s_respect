from PIL import Image, ImageDraw

width = 180 * 2
height = 40 * 2

measures = 124

size = (width, height * measures // 2)

img = Image.new('RGB', size, color = 'white')

d = ImageDraw.Draw(img)
section_width = 62 * 2

main_color = (0, 0, 0)
sub_color = (200, 200, 200)
lines = [22 * 2, (22 + 62 + 10) * 2]
for line_y in range(0, height * measures, height):
    for line_x in lines:
        d.line([(line_x, line_y + height), (line_x + section_width, line_y + height)], fill=main_color, width=1)
        d.line([(line_x, line_y), (line_x, line_y + height)], fill=sub_color, width=1)
        d.line([(line_x + section_width // 4, line_y), (line_x + section_width // 4, line_y + height)], fill=sub_color, width=1)
        d.line([(line_x + section_width // 2, line_y), (line_x + section_width // 2, line_y + height)], fill=sub_color, width=1)
        d.line([(line_x + section_width // 4 * 3, line_y), (line_x + section_width // 4 * 3, line_y + height)], fill=sub_color, width=1)
        d.line([(line_x + section_width, line_y), (line_x + section_width, line_y + height)], fill=sub_color, width=1)

img.save('/mnt/z/chord_base.png')

